import { supabase } from './supabase';
import type { Spot, ReportReason } from '../types/database';

// profiles とは spots.author_id 経由の他に likes テーブルを介した間接的な関連もあり、
// PostgREST がどちらか一意に判断できずエラーになるため、FK制約名で明示的に指定する
const SPOT_SELECT = `
  *,
  images:spot_images(id, storage_path, position),
  tags:spot_tags(tag:tags(id, name)),
  author:profiles!spots_author_id_fkey(id, username, display_name, avatar_url)
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

export async function fetchSpotById(id: string): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('id', id)
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
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  tagIds: number[];
  imagePaths: string[]; // Storage にアップロード済みのパス
}

export async function createSpot(authorId: string, input: CreateSpotInput): Promise<Spot> {
  const { data: spot, error } = await supabase
    .from('spots')
    .insert({
      author_id: authorId,
      title: input.title,
      description: input.description ?? null,
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
      input.imagePaths.map((path, i) => ({
        spot_id: spot.id,
        storage_path: path,
        position: i,
      }))
    );
    if (imgError) throw imgError;
  }

  return fetchSpotById(spot.id);
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

// join結果のネスト構造をフラットな Spot[] に整形する
function normalizeSpots(rows: any[]): Spot[] {
  return rows.map((row) => ({
    ...row,
    tags: (row.tags ?? []).map((t: any) => t.tag).filter(Boolean),
  }));
}
