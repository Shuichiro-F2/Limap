import { supabase } from './supabase';
import { detectEmbedUrl, MAX_SNS_EMBEDS } from './embeds';
import type { Spot, SpotImage, ReportReason, VisitTime } from '../types/database';

// profiles とは spots.author_id 経由の他に likes テーブルを介した間接的な関連もあり、
// PostgREST がどちらか一意に判断できずエラーになるため、FK制約名で明示的に指定する
const SPOT_SELECT = `
  *,
  images:spot_images(id, storage_path, thumbnail_path, position),
  embeds:spot_embeds(id, platform, url, position, created_at),
  tags:spot_tags(tag:tags(id, name)),
  author:profiles!spots_author_id_fkey(id, username, display_name, avatar_url, badge_type_key, badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color))
`;

// 地図の表示範囲(bounding box)内の投稿を取得する
export async function fetchSpotsInBounds(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .gte('lat', bounds.minLat)
    .lte('lat', bounds.maxLat)
    .gte('lng', bounds.minLng)
    .lte('lng', bounds.maxLng)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return normalizeSpots(data ?? []);
}

// URLのスラッグ（LIMap ID）から投稿を取得する
export async function fetchSpotBySlug(slug: string): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return normalizeSpots([data])[0];
}

export interface SearchSpotsParams {
  keyword?: string;
  tagIds?: number[];
}

// タイトル・説明文のキーワード検索と、タグでの絞り込み（複数選択時はOR条件）
export async function searchSpots(params: SearchSpotsParams): Promise<Spot[]> {
  let spotIdFilter: string[] | null = null;

  if (params.tagIds && params.tagIds.length > 0) {
    const { data, error } = await supabase
      .from('spot_tags')
      .select('spot_id')
      .in('tag_id', params.tagIds);
    if (error) throw error;
    spotIdFilter = Array.from(new Set((data ?? []).map((r: any) => r.spot_id)));
    if (spotIdFilter.length === 0) return [];
  }

  let query = supabase.from('spots').select(SPOT_SELECT).eq('status', 'published');

  const keyword = params.keyword?.trim();
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }
  if (spotIdFilter) {
    query = query.in('id', spotIdFilter);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return normalizeSpots(data ?? []);
}

// フィード: 全投稿からランダムに一部を取り出す（X/Instagramのような発見用フィード）
export async function fetchRandomSpots(limit = 30): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .limit(300);

  if (error) throw error;
  const spots = normalizeSpots(data ?? []);
  return shuffleArray(spots).slice(0, limit);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// フィードタブ: フォロー中のユーザーの投稿を新しい順で取得する
export async function fetchFollowingFeed(userId: string): Promise<Spot[]> {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', userId);
  if (followsError) throw followsError;

  const followeeIds = (follows ?? []).map((f: any) => f.followee_id);
  if (followeeIds.length === 0) return [];

  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .in('author_id', followeeIds)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return normalizeSpots(data ?? []);
}

// マイページ: 自分の投稿一覧（非公開/非表示になったものも本人には見える）
export async function fetchSpotsByAuthor(authorId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('author_id', authorId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return normalizeSpots(data ?? []);
}

// ユーザープロフィール画面: 他ユーザーにも見える公開投稿のみ取得する
export async function fetchPublishedSpotsByAuthor(authorId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return normalizeSpots(data ?? []);
}

// マイページ: いいねした投稿一覧
export async function fetchLikedSpots(userId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('likes')
    .select(`spot:spots!likes_spot_id_fkey(${SPOT_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return normalizeSpots((data ?? []).map((r: any) => r.spot).filter(Boolean));
}

// マイページ: 行きたい場所（ブックマーク）一覧
export async function fetchBookmarkedSpots(userId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`spot:spots!bookmarks_spot_id_fkey(${SPOT_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return normalizeSpots((data ?? []).map((r: any) => r.spot).filter(Boolean));
}

export async function toggleBookmark(userId: string, spotId: string, currentlyBookmarked: boolean) {
  if (currentlyBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('spot_id', spotId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('bookmarks').insert({ user_id: userId, spot_id: spotId });
    if (error) throw error;
  }
}

export async function isSpotBookmarked(userId: string, spotId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('spot_id')
    .eq('user_id', userId)
    .eq('spot_id', spotId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function isSpotLiked(userId: string, spotId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('spot_id')
    .eq('user_id', userId)
    .eq('spot_id', spotId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export interface CreateSpotInput {
  title: string;
  description?: string;
  access?: string; // 最寄り駅からの行き方など、現地にたどり着くためのヒント(任意)
  recommendedVisitTime?: VisitTime; // おすすめの訪問時間帯(任意)
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  tagIds: number[];
  // Storage にアップロード済みのパス。thumbnailPathはグリッド/カード表示用の
  // 軽量サムネイル(生成に失敗した場合はnull=フル画像で代用)
  imagePaths: { path: string; thumbnailPath: string | null }[];
  embedUrls?: string[]; // 「SNSで話題の場所」を紹介するためのInstagram/X投稿URL(プラットフォームは自動判定する)
}

export async function createSpot(authorId: string, input: CreateSpotInput): Promise<Spot> {
  if (input.tagIds.length > 5) {
    throw new Error('タグは5個までしか設定できません');
  }
  const embedUrls = input.embedUrls ?? [];
  if (embedUrls.length > MAX_SNS_EMBEDS) {
    throw new Error(`SNS投稿は${MAX_SNS_EMBEDS}件までしか設定できません`);
  }
  const detectedEmbeds = embedUrls.map((url) => detectEmbedUrl(url));
  if (detectedEmbeds.some((e) => !e)) {
    throw new Error('SNS投稿のURLが正しくありません(Instagram/Xの投稿URLを指定してください)');
  }

  const { data: spot, error } = await supabase
    .from('spots')
    .insert({
      author_id: authorId,
      title: input.title,
      description: input.description ?? null,
      access: input.access ?? null,
      recommended_visit_time: input.recommendedVisitTime ?? null,
      lat: input.lat,
      lng: input.lng,
      country: input.country ?? null,
      city: input.city ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('spot_tags')
      .insert(input.tagIds.map((tagId) => ({ spot_id: spot.id, tag_id: tagId })));
    if (tagError) throw tagError;
  }

  if (input.imagePaths.length > 0) {
    const { error: imgError } = await supabase.from('spot_images').insert(
      input.imagePaths.map((img, i) => ({
        spot_id: spot.id,
        storage_path: img.path,
        thumbnail_path: img.thumbnailPath,
        position: i,
      }))
    );
    if (imgError) throw imgError;
  }

  if (detectedEmbeds.length > 0) {
    const { error: embedError } = await supabase.from('spot_embeds').insert(
      detectedEmbeds.map((embed, i) => ({
        spot_id: spot.id,
        platform: embed!.platform,
        url: embed!.url,
        position: i,
      }))
    );
    if (embedError) throw embedError;
  }

  // slugはDB側のDEFAULTで自動採番されているため、insert結果にそのまま含まれている
  return fetchSpotBySlug(spot.slug);
}

export async function toggleLike(userId: string, spotId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('spot_id', spotId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ user_id: userId, spot_id: spotId });
    if (error) throw error;
  }
}

// 投稿者本人による投稿削除。spots行の削除はRLS("authors can delete own spots")で
// 本人以外は拒否されるが、Storage上の画像ファイルはDBのcascade削除では消えないため、
// 先に対象の画像を明示的に削除してからspots行を削除する。
export async function deleteSpot(spot: Spot): Promise<void> {
  // フル画像に加え、別途生成しているサムネイル画像も孤立ファイルとして残らないよう削除する
  const paths = (spot.images ?? []).flatMap((img) => [img.storage_path, img.thumbnail_path]).filter(Boolean) as string[];
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from('spot-images').remove(paths);
    // Storage側の削除に失敗しても、投稿自体は削除できるよう続行する（孤立ファイルは残るが致命的ではない）
    if (storageError) console.warn('画像ファイル削除エラー', storageError);
  }

  const { error } = await supabase.from('spots').delete().eq('id', spot.id);
  if (error) throw error;
}

export async function reportSpot(
  reporterId: string,
  spotId: string,
  reason: ReportReason,
  note?: string
) {
  const { error } = await supabase.from('reports').insert({
    spot_id: spotId,
    reporter_id: reporterId,
    reason,
    note: note ?? null,
  });
  if (error) throw error;
}

export function spotImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from('spot-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

// グリッド/カードなど小さい表示専用。サムネイルが生成されていればそちらを、
// なければフル画像を使う。フル画像は詳細画面のような大きな表示でのみ使うこと
// (一覧画面で毎回フル画像を読み込むと、投稿数の多いアカウントを開いたときに
// 大量の高解像度画像を同時デコードして重くなる)。
export function spotImageThumbUrl(image: Pick<SpotImage, 'storage_path' | 'thumbnail_path'>): string {
  return spotImageUrl(image.thumbnail_path ?? image.storage_path);
}

// join結果のネスト構造をフラットな Spot[] に整形する
function normalizeSpots(rows: any[]): Spot[] {
  return rows.map((row) => ({
    ...row,
    tags: (row.tags ?? []).map((t: any) => t.tag).filter(Boolean),
    embeds: [...(row.embeds ?? [])].sort((a: any, b: any) => a.position - b.position),
  }));
}
