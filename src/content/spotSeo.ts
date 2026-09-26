// スポットページのタイトル・説明文・地名を作る共通処理。
// サーバー側の初期HTML(api/spot.ts)と、Web版アプリが画面表示後に付け直すタイトル(src/lib/seo.ts)の
// 両方から使い、どちらでも同じ文言になるようにする。React Native に依存しないプレーンなTS。
//
// 地名は、公式スポットに付けた都道府県タグ（国内）・国名タグ（海外）から取る
// （spots.city / country は未入力のため。入っていればそちらも使う）。

import { JAPAN_PREFECTURES, prefectureFullName } from './japan';

export const SITE_NAME = 'LIMap（リマップ）';

// 公式スポットに付けている国名タグ（supabase/migrations/0021_official_spot_tags_and_dedup.sql）
export const COUNTRY_TAGS = [
  'アメリカ', 'イギリス', 'イタリア', 'ドイツ', 'フランス', 'スペイン', 'スウェーデン', '香港', '中国', 'ブラジル',
  'ベルギー', 'セルビア', 'ポルトガル', 'ロシア', 'トルコ', 'カナダ', 'ノルウェー', '韓国', '北朝鮮', '台湾',
  '南アフリカ', 'ウクライナ', 'ルーマニア', 'メキシコ', 'ウズベキスタン', 'カザフスタン', 'オーストリア', 'チェコ',
  'スリランカ', 'アラブ首長国連邦', 'タイ', 'ブルガリア', 'マレーシア', 'インド', 'アンゴラ', 'ナミビア',
  'ボスニア・ヘルツェゴビナ', 'オーストラリア', 'アルゼンチン', 'チリ', 'トルクメニスタン', 'アゼルバイジャン',
  'エジプト', '北マケドニア', 'ベトナム', 'コートジボワール', 'スイス', 'オランダ',
];

export type SpotPlace = {
  // 表示用の地名（例: 東京都 / 滋賀県・福井県 / オランダ）。わからなければ null
  label: string | null;
  // 国内なら都道府県タグ名（例: ['東京']）、海外なら空
  prefectures: string[];
  // 国名（国内なら「日本」）
  country: string | null;
};

export function spotPlace(tagNames: string[], city?: string | null, country?: string | null): SpotPlace {
  const prefectures = JAPAN_PREFECTURES.filter((p) => tagNames.includes(p));
  if (prefectures.length > 0) {
    return { label: prefectures.map(prefectureFullName).join('・'), prefectures, country: '日本' };
  }
  const countryTag = COUNTRY_TAGS.find((c) => tagNames.includes(c));
  if (countryTag) return { label: countryTag, prefectures: [], country: countryTag };
  const legacy = [city, country].filter(Boolean).join(', ');
  return { label: legacy || null, prefectures: [], country: country || null };
}

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

// 投稿のタイトルに改行が含まれることがあるため、空白・改行は1つの空白にまとめる（<title> などが途中で割れないように）
export function spotRawTitle(spot: { title: string | null; description: string | null }): string {
  return ((spot.title || '').trim() || (spot.description || '').trim().slice(0, 40) || '無題の投稿').replace(/\s+/g, ' ');
}

// <title>・og:title 用（例: 「清澄白河駅の不気味な通路（東京都） | LIMap（リマップ）」）
export function spotPageTitle(rawTitle: string, place: SpotPlace): string {
  return `${truncate(rawTitle, 40)}${place.label ? `（${place.label}）` : ''} | ${SITE_NAME}`;
}

// meta description 用（例: 「東京都にあるリミナルスペースの記録。…」）
export function spotPageDescription(description: string | null, place: SpotPlace): string {
  const base =
    (description || '').trim() || 'リミナルスペースを記録した投稿です。写真と場所の詳細はLIMapでご覧いただけます。';
  return truncate(place.label ? `${place.label}にあるリミナルスペースの記録。${base}` : base, 120);
}
