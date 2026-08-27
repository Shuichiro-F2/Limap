// Supabase テーブルに対応する型定義
// `supabase gen types typescript` で自動生成に置き換え可能

export type SpotStatus = 'published' | 'hidden' | 'removed';
export type ReportReason = 'inappropriate' | 'privacy' | 'spam' | 'wrong_location' | 'other';
// 通報の対象種別。スポット本体だけでなく、レビュー投稿・ユーザーアカウントも通報できる。
export type ReportTargetType = 'spot' | 'review' | 'user';

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

// 投稿者が選べる「おすすめの訪問時間帯」。リミナルスペースは時間帯によって
// 雰囲気が大きく変わるため、最も雰囲気を感じられる時間帯を任意で選択できる。
export type VisitTime = 'morning' | 'daytime' | 'dusk' | 'night';

export interface SpotEmbed {
  id: string;
  spot_id: string;
  platform: SpotEmbedPlatform;
  url: string;
  // 投稿作成/編集時にあらかじめ取得しておいた、埋め込み投稿のサムネイル画像URL。
  // 取得できなかった場合(テキストのみの投稿など)はnull。
  thumbnail_url: string | null;
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
  // 投稿者が選んだおすすめの訪問時間帯(任意、未設定の場合はnull)
  recommended_visit_time: VisitTime | null;
  // 投稿者が指定したGoogleマップのリンク(任意)。未設定の場合は緯度経度から生成したリンクを使う
  google_maps_url: string | null;
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
  target_type: ReportTargetType;
  // target_typeに応じて、以下のいずれか1つだけが値を持つ
  spot_id: string | null;
  review_id: string | null;
  reported_user_id: string | null;
  reporter_id: string;
  reason: ReportReason;
  note: string | null;
  created_at: string;
}

// ユーザーブロック(片方向)。自分がブロックした相手の投稿・レビューは
// クライアント側でフィード・検索・地図・スポット詳細から除外する。
export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  // クライアント側でjoinして付与するフィールド
  blocked?: Profile;
}

// 既存スポットに他ユーザーが追加できる「レビュー」投稿(写真・SNS埋め込み・コメント・
// 訪問時間帯)。spots本体とほぼ同じ構成だが、位置情報・タイトル・タグは持たず、
// 常に既存のスポット(spot_id)に紐付く。
export interface SpotReviewImage {
  id: string;
  review_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  position: number;
  created_at: string;
}

export interface SpotReviewEmbed {
  id: string;
  review_id: string;
  platform: SpotEmbedPlatform;
  url: string;
  thumbnail_url: string | null;
  position: number;
  created_at: string;
}

export interface SpotReview {
  id: string;
  spot_id: string;
  author_id: string;
  description: string | null;
  recommended_visit_time: VisitTime | null;
  report_count: number;
  created_at: string;
  updated_at: string;
  // クライアント側でjoinして付与するフィールド
  images?: SpotReviewImage[];
  embeds?: SpotReviewEmbed[];
  author?: Profile;
}
