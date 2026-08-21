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
      browseHeading: 'ハッシュタグ',
      browseLead: '気になるハッシュタグをタップすると、関連する投稿を検索できます。',
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
    createSpot: {
      headerTitle: '投稿する',
      name: 'スポット名',
      namePlaceholder: '例: 誰もいない駅の連絡通路',
      nameHelp: 'この投稿につける名前です。空欄の場合は説明文などから自動的に設定されます。',
      location: '位置情報',
      locationSet: '設定済み',
      useCurrentLocation: '現在地を使用',
      chooseOnMap: '地図から選択',
      locationHelp: 'この投稿の場所を地図上で指定します。正確な住所でなくてもかまいません。',
      access: 'アクセス',
      accessPlaceholder: '最寄り駅からの行き方など',
      accessHelp: '最寄り駅からの行き方や目印など、現地にたどり着くためのヒントを書けます。',
      photos: '写真',
      photosHelp: '最大{n}枚まで追加できます。自動的に縮小・圧縮されてからアップロードされます。',
      pickPhotos: '写真を選択',
      embeds: 'SNS投稿',
      embedsHelp:
        '最大{n}件まで追加できます。Instagram・Xで話題になっている場所であれば、関連する投稿のURLを追加すると詳細画面に埋め込み表示されます。',
      embedPlaceholder: 'https://www.instagram.com/p/... または https://x.com/.../status/...',
      mediaRequiredNote: '写真またはSNS投稿のいずれか一方は必須です',
      hashtags: 'ハッシュタグ',
      hashtagsHelp: '最大{n}個まで追加できます。雰囲気を表すキーワードを追加すると、検索で見つけてもらいやすくなります。',
      hashtagPlaceholder: 'ハッシュタグを入力（新規作成も可）',
      description: '説明',
      descriptionPlaceholder: '場所の雰囲気や見つけ方など',
      descriptionHelp: '場所の雰囲気や特徴、見つけ方などを自由に書けます。',
      add: '追加',
      submit: '投稿する',
      submitting: '投稿中…',
      submitSuccessTitle: '投稿しました',
      submitFailedTitle: '投稿に失敗しました',
      locationRequiredTitle: '位置情報を設定してください',
      mediaRequiredTitle: '写真またはSNS投稿のいずれかを追加してください',
      embedInvalidTitle: '投稿のURLが正しくありません',
      embedInvalidMessage: 'Instagram投稿(https://www.instagram.com/p/...)またはX投稿(https://x.com/.../status/...)のURLを入力してください',
      embedLimitTemplate: 'SNS投稿は{n}件まで設定できます',
      hashtagLimitTemplate: 'ハッシュタグは{n}個まで設定できます',
      photoPermissionTitle: '写真ライブラリへのアクセス許可が必要です',
      locationPermissionTitle: '位置情報の許可が必要です',
      tagAddFailedTitle: 'ハッシュタグの追加に失敗しました',
      loginRequiredTitle: 'ログインが必要です',
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
      browseHeading: 'Hashtags',
      browseLead: 'Tap a hashtag to search for related posts.',
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
    createSpot: {
      headerTitle: 'New Post',
      name: 'Spot Name',
      namePlaceholder: 'e.g. An empty station passageway',
      nameHelp: 'A name for this post. If left blank, one will be generated automatically from the description.',
      location: 'Location',
      locationSet: 'Set',
      useCurrentLocation: 'Use current location',
      chooseOnMap: 'Choose on map',
      locationHelp: "Set this spot's location on the map. An exact address isn't required.",
      access: 'Access',
      accessPlaceholder: 'e.g. directions from the nearest station',
      accessHelp: 'Add directions or landmarks to help others find this spot.',
      photos: 'Photos',
      photosHelp: 'You can add up to {n}. Photos are automatically resized and compressed before uploading.',
      pickPhotos: 'Choose photos',
      embeds: 'SNS Embeds',
      embedsHelp:
        'You can add up to {n}. If this spot is featured on Instagram or X, add the URL of a related post to embed it on the detail screen.',
      embedPlaceholder: 'https://www.instagram.com/p/... or https://x.com/.../status/...',
      mediaRequiredNote: 'A photo or an SNS embed is required',
      hashtags: 'Hashtags',
      hashtagsHelp: 'You can add up to {n}. Adding keywords that describe the mood helps others find this spot through search.',
      hashtagPlaceholder: 'Enter a hashtag (you can create new ones)',
      description: 'Description',
      descriptionPlaceholder: 'Describe the atmosphere, how to find it, etc.',
      descriptionHelp: 'Freely describe the mood, features, or how to find this place.',
      add: 'Add',
      submit: 'Post',
      submitting: 'Posting…',
      submitSuccessTitle: 'Posted',
      submitFailedTitle: 'Failed to post',
      locationRequiredTitle: 'Please set a location',
      mediaRequiredTitle: 'Please add a photo or an SNS embed',
      embedInvalidTitle: 'Invalid post URL',
      embedInvalidMessage: 'Please enter a valid Instagram (https://www.instagram.com/p/...) or X (https://x.com/.../status/...) post URL',
      embedLimitTemplate: 'You can add up to {n} SNS embeds',
      hashtagLimitTemplate: 'You can add up to {n} hashtags',
      photoPermissionTitle: 'Photo library access is required',
      locationPermissionTitle: 'Location permission is required',
      tagAddFailedTitle: 'Failed to add hashtag',
      loginRequiredTitle: 'Login required',
    },
  },
} as const;

export function useTranslation() {
  const { language } = useLanguage();
  return dictionary[language];
}
