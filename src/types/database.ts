// Supabase テーブルに対応する型定義
// `supabase gen types typescript` で自動生成に置き換え可能

export type SpotStatus = 'published' | 'hidden' | 'removed';
export type ReportReason = 'inappropriate' | 'privacy' | 'spam' | 'wrong_location' | 'other';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface SpotImage {
  id: string;
  spot_id: string;
  storage_path: string;
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
  tags?: Tag[];
  author?: Profile;
  like_count?: number;
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
