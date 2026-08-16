import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// アプリ全体の表示言語（日本語/英語）。
// 記事ページ(public/articles)の言語切り替えと同じ考え方で、
// 固定のUI文言（見出し・ボタン・案内文など）だけを切り替える。
// スポットの説明文やユーザー名など、ユーザーが投稿した内容は翻訳せず原文のまま表示する
// （リアルタイム翻訳には別途、翻訳APIとの連携が必要なため今回は未対応）。
export type Language = 'ja' | 'en';

const STORAGE_KEY = 'limap-app-lang';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ja');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'ja') setLanguageState(saved);
      })
      .catch(() => {});
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// 4つのタブ画面（地図・フィード・検索・マイページ）の固定UI文言。
// 対象はUIラベルのみで、投稿内容・ユーザー名などのユーザー生成コンテンツは含まない。
const dictionary = {
  ja: {
    map: {
      searchPlaceholder: '住所や施設名で検索',
    },
    feed: {
      loggedOutMessage: 'ログインすると、フォロー中のユーザーの投稿が新着順でここに表示されます。',
      loginButton: 'ログイン / 新規登録',
      empty: 'フォロー中のユーザーの投稿がありません。気になる投稿者をフォローしてみましょう。',
    },
    search: {
      placeholder: 'タイトルや説明文で検索',
      empty: '該当するスポットが見つかりませんでした',
      browseHeading: '雰囲気タグ',
      browseLead: '気になるタグをタップすると、その雰囲気の投稿を検索できます。',
    },
    myPage: {
      followers: 'フォロワー',
      following: 'フォロー中',
      help: '使い方',
      about: 'リミナルスペースとは',
      logout: 'ログアウト',
      empty: 'まだ表示できるスポットがありません',
    },
    articles: {
      pageTitle: 'コラム',
      pageLead: 'リミナルスペースにまつわる読み物を集めました。',
    },
  },
  en: {
    map: {
      searchPlaceholder: 'Search by address or place name',
    },
    feed: {
      loggedOutMessage: 'Log in to see the latest posts from people you follow, right here.',
      loginButton: 'Log In / Sign Up',
      empty: "No posts yet from people you follow. Try following someone whose posts you like.",
    },
    search: {
      placeholder: 'Search by title or description',
      empty: 'No matching spots found',
      browseHeading: 'Mood Tags',
      browseLead: 'Tap a tag to search for posts with that mood.',
    },
    myPage: {
      followers: 'Followers',
      following: 'Following',
      help: 'Help',
      about: 'What is a Liminal Space?',
      logout: 'Log Out',
      empty: 'No spots to show yet',
    },
    articles: {
      pageTitle: 'Articles',
      pageLead: 'A collection of reads about liminal spaces.',
    },
  },
} as const;

export function useTranslation() {
  const { language } = useLanguage();
  return dictionary[language];
}
