import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { Session } from '@supabase/supabase-js';
import { migrateGuestBookmarks } from './guestBookmarks';
import { supabase } from './supabase';
import { fetchBlockedUserIds } from './moderation';
import type { Profile } from '../types/database';

// ネイティブアプリでのGoogleログイン後に戻ってくるURL（app.json の scheme と合わせる）
const NATIVE_OAUTH_REDIRECT = 'limap://auth/callback';

// expo-web-browser はネイティブモジュール。これを含まない古いビルド（1.0.0）にOTAでこのコードが届いても
// 落ちないよう、ネイティブ側にモジュールがあるときだけ読み込む。無いビルドではGoogleボタンを出さない。
const WebBrowser: typeof import('expo-web-browser') | null =
  Platform.OS !== 'web' && requireOptionalNativeModule('ExpoWebBrowser') ? require('expo-web-browser') : null;

// ログイン画面でGoogleボタンを出すかどうか（Webは常に、ネイティブはexpo-web-browser入りのビルドだけ）
export const googleLoginAvailable = Platform.OS === 'web' || WebBrowser !== null;

// ログイン後に戻ってきたURLからセッションを作る。
// 今の設定（implicitフロー）では URL の # 以降にトークンが入る。PKCEフローに変えた場合に備えて ?code= にも対応する。
async function createSessionFromRedirect(url: string) {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(hash);
  new URLSearchParams(query).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  const errorDescription = params.get('error_description') || params.get('error');
  if (errorDescription) throw new Error(errorDescription);

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('Login was not completed');
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
}

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
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ alreadyRegistered: boolean; signedIn: boolean }>;
  signInWithOAuth: (provider: 'google') => Promise<boolean>;
  // iOSネイティブのみ。ユーザーがキャンセルした場合は何もせず終了する(エラー表示しない)。
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  // アカウント削除(退会)。サーバー側(api/delete-account)でauth.usersごと削除するため、
  // 完了後はローカルのセッションもクリアする。
  deleteAccount: () => Promise<void>;
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

  // 未ログインのときにこの端末へ保存した「行きたい」場所を、ログインしたアカウントへ移す
  useEffect(() => {
    if (!session?.user) return;
    migrateGuestBookmarks(session.user.id).catch((e) => console.warn('保存した場所の引き継ぎエラー', e));
  }, [session?.user?.id]);

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
    // メールアドレスの確認をしない設定（Supabase の Confirm email がオフ）では、登録と同時にログインした状態になる。
    // そのときは session が返るので、確認メールの案内は出さずにそのまま使い始められるようにする。
    const signedIn = !!data.session;
    return { alreadyRegistered, signedIn };
  };

  // Googleログイン。戻り値は、ネイティブでその場でログインが完了したときだけtrue
  // （Webはページごとリダイレクトするので戻ってこない。ネイティブでキャンセルされたときはfalse）。
  // Web: ブラウザのリダイレクト経由。戻り先(redirectTo)を明示しないと、リダイレクト後にアプリへ正しく戻れないことがある。
  const signInWithOAuth = async (provider: 'google') => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return false;
    }

    // ネイティブ：supabase-jsはブラウザ以外ではログイン画面へ移動しないため、
    // ログイン画面のURLだけを受け取り、アプリ内のブラウザ（iOSはASWebAuthenticationSession）で開く。
    // ログインが終わると limap://auth/callback に戻ってくるので、そのURLからセッションを作る。
    // このURLは Supabase の Authentication → URL Configuration の Redirect URLs に登録しておく必要がある。
    if (!WebBrowser) throw new Error('Google login is not available in this version of the app');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('OAuth URL is missing');

    const result = await WebBrowser.openAuthSessionAsync(data.url, NATIVE_OAUTH_REDIRECT);
    // ユーザーが閉じた・キャンセルした場合は何もしない（エラー表示しない）
    if (result.type !== 'success') return false;
    await createSessionFromRedirect(result.url);
    return true;
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

  // アカウント削除(退会)。auth.usersの削除には管理者権限(service roleキー)が必要で、
  // これはアプリ本体には絶対に含められないため、サーバー側のapi/delete-accountを
  // 呼び出す。現在のセッションのaccess_tokenを渡すことで、サーバー側がトークンから
  // 本人確認を行い、そのユーザー自身のアカウントだけを削除する。
  const deleteAccount = async () => {
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error('ログイン情報が確認できませんでした。再度ログインしてからお試しください。');

    const res = await fetch('https://limap.jp/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      let message = 'アカウントの削除に失敗しました。時間をおいて再度お試しください。';
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // レスポンスがJSONでない場合はデフォルトのメッセージのまま
      }
      throw new Error(message);
    }

    // サーバー側での削除が完了したら、ローカルに残っているセッションもクリアする
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
        deleteAccount,
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
