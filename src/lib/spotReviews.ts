import { supabase } from './supabase';
import { detectEmbedUrl, MAX_SNS_EMBEDS } from './embeds';
import { fetchEmbedThumbnail } from './embedThumbnail';
import type { SpotReview, VisitTime } from '../types/database';

// 既存スポットに他ユーザーが追加できる「レビュー」投稿のCRUD。
// createSpot/updateSpot(spots.ts)とほぼ同じ構成・考え方だが、位置情報・タイトル・
// タグを持たず、常に既存のspot_idに紐付く点が異なる。

const REVIEW_SELECT = `
  *,
  images:spot_review_images(id, storage_path, thumbnail_path, position),
  embeds:spot_review_embeds(id, platform, url, thumbnail_url, position, created_at),
  author:profiles!spot_reviews_author_id_fkey(id, username, display_name, avatar_url, badge_type_key, badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color))
`;

function normalizeReviews(rows: any[]): SpotReview[] {
  return rows.map((row) => ({
    ...row,
    images: [...(row.images ?? [])].sort((a: any, b: any) => a.position - b.position),
    embeds: [...(row.embeds ?? [])].sort((a: any, b: any) => a.position - b.position),
  }));
}

export async function fetchSpotReviews(spotId: string): Promise<SpotReview[]> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select(REVIEW_SELECT)
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return normalizeReviews(data ?? []);
}

export interface CreateSpotReviewInput {
  description?: string;
  recommendedVisitTime?: VisitTime;
  imagePaths: { path: string; thumbnailPath: string | null }[];
  embedUrls?: string[];
}

export async function createSpotReview(
  authorId: string,
  spotId: string,
  input: CreateSpotReviewInput
): Promise<SpotReview> {
  const embedUrls = input.embedUrls ?? [];
  if (embedUrls.length > MAX_SNS_EMBEDS) {
    throw new Error(`SNS投稿は${MAX_SNS_EMBEDS}件までしか設定できません`);
  }
  const detectedEmbeds = embedUrls.map((url) => detectEmbedUrl(url));
  if (detectedEmbeds.some((e) => !e)) {
    throw new Error('SNS投稿のURLが正しくありません(Instagram/Xの投稿URLを指定してください)');
  }
  // 画像がない投稿でも一覧に何か表示できるよう、埋め込み投稿のサムネイルを
  // spots本体の投稿と同様に先に取得しておく
  const embedThumbnailsPromise = Promise.all(
    detectedEmbeds.map((embed) => fetchEmbedThumbnail(embed!.platform, embed!.url))
  );

  const { data: review, error } = await supabase
    .from('spot_reviews')
    .insert({
      spot_id: spotId,
      author_id: authorId,
      description: input.description ?? null,
      recommended_visit_time: input.recommendedVisitTime ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.imagePaths.length > 0) {
    const { error: imgError } = await supabase.from('spot_review_images').insert(
      input.imagePaths.map((img, i) => ({
        review_id: review.id,
        storage_path: img.path,
        thumbnail_path: img.thumbnailPath,
        position: i,
      }))
    );
    if (imgError) throw imgError;
  }

  if (detectedEmbeds.length > 0) {
    const embedThumbnails = await embedThumbnailsPromise;
    const { error: embedError } = await supabase.from('spot_review_embeds').insert(
      detectedEmbeds.map((embed, i) => ({
        review_id: review.id,
        platform: embed!.platform,
        url: embed!.url,
        thumbnail_url: embedThumbnails[i] ?? null,
        position: i,
      }))
    );
    if (embedError) throw embedError;
  }

  const { data, error: fetchError } = await supabase
    .from('spot_reviews')
    .select(REVIEW_SELECT)
    .eq('id', review.id)
    .single();
  if (fetchError) throw fetchError;
  return normalizeReviews([data])[0];
}

// 投稿者本人によるレビュー削除。Storage上の画像ファイルはDBのcascade削除では
// 消えないため、先に対象の画像を明示的に削除してからspot_reviews行を削除する。
export async function deleteSpotReview(review: SpotReview): Promise<void> {
  const paths = (review.images ?? [])
    .flatMap((img) => [img.storage_path, img.thumbnail_path])
    .filter(Boolean) as string[];
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from('spot-images').remove(paths);
    if (storageError) console.warn('レビュー画像ファイル削除エラー', storageError);
  }

  const { error } = await supabase.from('spot_reviews').delete().eq('id', review.id);
  if (error) throw error;
}
