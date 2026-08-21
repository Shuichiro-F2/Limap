// Supabase テーブルに対応する型定義
// `supabase gen types typescript` で自動生成に置き換え可能

export type SpotStatus = 'published' | 'hidden' | 'removed';
export type ReportReason = 'inappropriate' | 'privacy' | 'spam' | 'wrong_location' | 'other';

// アカウントに付与できるバッジ(公式マーク/将来的なスポンサー・アンバサダー等)の種別。
// badge_typesテーブルの内容をそのまま表す。新しい種別を追加してもアプリのコード変更は不要で、
// UI側は未知のkeyでもlabel/icon/colorだけを見て汎用的に描画する。
export interface BadgeType {
  key: string;
  label_ja: string;
  label_en: string;
  icon_name: string;
  bg_color: string;
  text_color: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  badge_type_key: string | null;
  // クライアント側でjoinして付与するフィールド(未付与の場合はnull)
  badge?: BadgeType | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface SpotImage {
  id: string;
  spot_id: string;
  storage_path: string;
  // グリッド/カードなど小さい表示専用の軽量サムネイル画像のパス。
  // 古い投稿など未生成の場合はnullで、その場合はstorage_path(フル画像)を代わりに使う。
  thumbnail_path: string | null;
  position: number;
  created_at: string;
}

// スポットに紐付けるSNS埋め込み(現状はInstagram投稿・X投稿に対応)。
export type SpotEmbedPlatform = 'instagram' | 'x';

export interface SpotEmbed {
  id: string;
  spot_id: string;
  platform: SpotEmbedPlatform;
  url: string;
  position: number;
  created_at: string;
}

export interface Spot {
  id: string;
  // LIMap ID: URLのスラッグに使う短い英数字ID（例: aB3xK9pQ）。内部の主キー(id)とは別物。
  slug: string;
  author_id: string;
  title: string;
  description: string | null;
  // 最寄り駅からの行き方など、現地にたどり着くためのヒントを書ける自由記述欄(任意)
  access: string | null;
  lat: number;
  lng: number;
  country: string | null;
  city: string | null;
  status: SpotStatus;
  report_count: number;
  created_at: string;
  updated_at: string;
  // クライアント側で join して付与するフィールド
  images?: SpotImage[];
  embeds?: SpotEmbed[];
  tags?: Tag[];
  author?: Profile;
  like_count: number;
  bookmark_count: number;
  liked_by_me?: boolean;
}

export interface Report {
  id: string;
  spot_id: string;
  reporter_id: string;
  reason: ReportReason;
  note: string | null;
  created_at: string;
}
