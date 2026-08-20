// スポット詳細画面に埋め込めるSNS投稿(Instagram/X)まわりの共通ロジック。
// プラットフォームごとのURL判定・正規化は instagram.ts / x.ts に分かれているが、
// 「入力されたURLがどちらの形式か」を判定する処理は投稿フォーム側・保存側の
// 両方で必要になるため、ここに共通化しておく。
import { isValidInstagramUrl, normalizeInstagramUrl } from './instagram';
import { isValidXUrl, normalizeXUrl } from './x';
import type { SpotEmbedPlatform } from '../types/database';

export const MAX_SNS_EMBEDS = 5;

export interface DetectedEmbed {
  platform: SpotEmbedPlatform;
  url: string; // 正規化済みのURL
}

// 入力されたURLがInstagram/Xどちらの投稿かを判定し、埋め込み用に正規化する。
// どちらの形式にも一致しない場合はnullを返す。
export function detectEmbedUrl(url: string): DetectedEmbed | null {
  const trimmed = url.trim();
  if (isValidInstagramUrl(trimmed)) return { platform: 'instagram', url: normalizeInstagramUrl(trimmed) };
  if (isValidXUrl(trimmed)) return { platform: 'x', url: normalizeXUrl(trimmed) };
  return null;
}
