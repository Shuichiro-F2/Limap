import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { fetchBlockedUserIds } from './moderation';
import type { Profile } from '../types/database';

// バッジ(公式マークなど)も含めて自分のプロフィールを取得する
const PROFILE_SELECT = `
  *,
  badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color)
`;

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // 自分がブロックしているユーザーのID集合。フィード・検索・地図・レビュー表示から
  // ブロック済みユーザーのコンテンツを除外するために、アプリ全体から参照できるようにしている。
  blockedUserIds: Set<string>;
  refreshBlockedUserIds: () => Promise<void>;
  // 運営(問い合わせ管理画面へのアクセス権を持つ)本人のアカウントかどうか。
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  // 戻り値のalreadyRegisteredは、すでに登録・確認済みのメールアドレスで
  // 新規登録しようとした場合にtrueになる(詳細はsignUpWithEmailの実装コメント参照)。
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ alreadyRegistered: boolean }>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  // iOSネイティブのみ。ユーザーがキャンセルした場合は何もせず終了する(エラー表示しない)。
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session?.user?.id]);

  const refreshBlockedUserIds = useCallback(async () => {
    if (!session?.user) {
      setBlockedUserIds(new Set());
      return;
    }
    try {
      const ids = await fetchBlockedUserIds(session.user.id);
      setBlockedUserIds(new Set(ids));
    } catch (e) {
      console.warn('ブロック中ユーザー取得エラー', e);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refreshBlockedUserIds();
  }, [refreshBlockedUserIds]);

  // プロフィール編集画面で表示名・自己紹介・アバターを更新した後、
  // アプリ内の各所（マイページのヘッダーなど）に即座に反映させるために使う
  const refreshProfile = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', session.user.id).single();
    if (data) setProfile(data);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    // Supabaseは、すでに登録・確認済みのメールアドレスで再度signUpされた場合でも、
    // メールアドレス列挙(このアドレスは登録済みか探る攻撃)を防ぐためエラーを返さず、
    // 新規登録成功時と見た目上同じレスポンスを返す。ただしこの場合はuser.identitiesが
    // 空配列になるため、これを「実はすでに登録済みだった」ことの判定に使う。
    const alreadyRegistered = !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
    return { alreadyRegistered };
  };

  // Web: ブラウザのリダイレクト経由でGoogleログインを行う。
  // 戻り先(redirectTo)を明示しないと、リダイレクト後にアプリへ正しく戻れないことがある。
  // ネイティブでのGoogleログインは expo-auth-session 等で別途フローを組む必要があるため未対応。
  const signInWithOAuth = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: Platform.OS === 'web' ? { redirectTo: window.location.origin } : undefined,
    });
    if (error) throw error;
  };

  // iOSネイティブ専用のApple公式ログイン(Sign in with Apple)。
  // Googleログインなどサードパーティのソーシャルログインを提供するアプリは、
  // Appleの審査ガイドライン(4.8)によりApple公式ログインも同等に用意する必要がある。
  // expo-apple-authenticationでネイティブのApple認証UIを呼び出し、得られたidentityTokenを
  // Supabase側(signInWithIdToken)に渡して、Supabase Auth上のセッションを確立する。
  const signInWithApple = async () => {
    let credential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (e: any) {
      // ユーザーが自分でキャンセルした場合はエラー扱いにしない
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      throw e;
    }

    if (!credential.identityToken) {
      throw new Error('Appleからの認証情報を取得できませんでした。');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        blockedUserIds,
        refreshBlockedUserIds,
        isAdmin: profile?.is_admin ?? false,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signInWithApple,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
