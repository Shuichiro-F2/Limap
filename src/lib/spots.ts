import { supabase } from './supabase';
import { detectEmbedUrl, MAX_SNS_EMBEDS } from './embeds';
import { fetchEmbedThumbnail } from './embedThumbnail';
import type { Spot, SpotImage, ReportReason, VisitTime } from '../types/database';

// profiles とは spots.author_id 経由の他に likes テーブルを介した間接的な関連もあり、
// PostgREST がどちらか一意に判断できずエラーになるため、FK制約名で明示的に指定する
const SPOT_SELECT = `
  *,
  images:spot_images(id, storage_path, thumbnail_path, position),
  embeds:spot_embeds(id, platform, url, thumbnail_url, position, created_at),
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

const NEARBY_DISTANCE_THRESHOLD_M = 300;

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface NearbySpotMatch {
  id: string;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  images?: SpotImage[];
  embeds?: Spot['embeds'];
}

const NEARBY_SELECT =
  'id, slug, title, lat, lng, images:spot_images(id, storage_path, thumbnail_path, position), embeds:spot_embeds(id, platform, url, thumbnail_url, position, created_at)';

// 新規投稿時に、既に近い場所や似た名前の投稿がないかを調べる(重複投稿防止のため)。
// 座標が近い(既定300m以内)、またはスポット名が部分一致(大文字小文字を無視)する
// 投稿を検出する。どちらかに該当すれば「重複の可能性あり」として返す。
export async function findNearbySpots(lat: number, lng: number, title: string): Promise<NearbySpotMatch[]> {
  // 緯度1度あたり約111km。距離のしきい値に十分な余裕を持たせたバウンディングボックスで
  // まず候補を絞り込み、正確な距離はクライアント側でhaversine計算する。
  const latDelta = (NEARBY_DISTANCE_THRESHOLD_M * 3) / 111000;
  const lngDelta = latDelta / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);

  const trimmedTitle = title.trim();

  const nearbyPromise = supabase
    .from('spots')
    .select(NEARBY_SELECT)
    .eq('status', 'published')
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .limit(50);

  const namePromise =
    trimmedTitle.length >= 2
      ? supabase.from('spots').select(NEARBY_SELECT).eq('status', 'published').ilike('title', `%${trimmedTitle}%`).limit(20)
      : Promise.resolve({ data: [] as any[], error: null });

  const [nearbyResult, nameResult] = await Promise.all([nearbyPromise, namePromise]);
  if (nearbyResult.error) throw nearbyResult.error;
  if (nameResult.error) throw nameResult.error;

  const candidates = new Map<string, any>();
  for (const row of [...(nearbyResult.data ?? []), ...(nameResult.data ?? [])]) {
    candidates.set(row.id, row);
  }

  const matches: NearbySpotMatch[] = [];
  for (const row of candidates.values()) {
    const distanceMeters = haversineMeters(lat, lng, row.lat, row.lng);
    const nameMatches = trimmedTitle.length >= 2 && (row.title as string).toLowerCase().includes(trimmedTitle.toLowerCase());
    if (distanceMeters <= NEARBY_DISTANCE_THRESHOLD_M || nameMatches) {
      matches.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        lat: row.lat,
        lng: row.lng,
        distanceMeters,
        images: row.images,
        embeds: row.embeds,
      });
    }
  }

  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches.slice(0, 3);
}

// タイムラインタブ「おすすめ」: 全投稿からランダムに一部を取り出す（X/Instagramのような発見用フィード）
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
  googleMapsUrl?: string; // 投稿者が指定するGoogleマップのリンク(任意、未指定なら緯度経度から生成)
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
  // 画像がない投稿でも一覧のグリッド/カードに何か表示できるよう、埋め込み投稿の
  // サムネイル画像を先に取得しておく(spots本体の作成と並行して走らせ、待ち時間を減らす)。
  const embedThumbnailsPromise = Promise.all(
    detectedEmbeds.map((embed) => fetchEmbedThumbnail(embed!.platform, embed!.url))
  );

  const { data: spot, error } = await supabase
    .from('spots')
    .insert({
      author_id: authorId,
      title: input.title,
      description: input.description ?? null,
      access: input.access ?? null,
      recommended_visit_time: input.recommendedVisitTime ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
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
    const embedThumbnails = await embedThumbnailsPromise;
    const { error: embedError } = await supabase.from('spot_embeds').insert(
      detectedEmbeds.map((embed, i) => ({
        spot_id: spot.id,
        platform: embed!.platform,
        url: embed!.url,
        thumbnail_url: embedThumbnails[i] ?? null,
        position: i,
      }))
    );
    if (embedError) throw embedError;
  }

  // slugはDB側のDEFAULTで自動採番されているため、insert結果にそのまま含まれている
  return fetchSpotBySlug(spot.slug);
}

export interface UpdateSpotInput {
  title: string;
  description?: string;
  access?: string;
  recommendedVisitTime?: VisitTime;
  googleMapsUrl?: string;
  lat: number;
  lng: number;
  tagIds: number[];
  // 既存画像のうち残すものの id 一覧。それ以外の既存画像(id)は削除される
  keepImageIds: string[];
  // 今回新たにアップロードした画像。既存の残す画像の後ろに追加される
  newImagePaths: { path: string; thumbnailPath: string | null }[];
  embedUrls?: string[];
}

// 投稿者本人による投稿編集。spotsテーブルの更新に加え、タグ・画像・SNS埋め込みも
// 送信された内容に合わせて入れ替える(タグ/埋め込みは全削除→再挿入、画像は差分のみ処理)。
export async function updateSpot(spot: Spot, input: UpdateSpotInput): Promise<Spot> {
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
  // 埋め込みは編集のたびに全削除→再挿入するため、サムネイルもURLが変わっていなくても
  // 都度取得し直す(投稿件数・頻度を踏まえるとAPI呼び出しコストは小さい)
  const embedThumbnailsPromise = Promise.all(
    detectedEmbeds.map((embed) => fetchEmbedThumbnail(embed!.platform, embed!.url))
  );

  const { error } = await supabase
    .from('spots')
    .update({
      title: input.title,
      description: input.description ?? null,
      access: input.access ?? null,
      recommended_visit_time: input.recommendedVisitTime ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      lat: input.lat,
      lng: input.lng,
    })
    .eq('id', spot.id);
  if (error) throw error;

  // タグはシンプルに全削除してから選択されたものを入れ直す
  const { error: delTagError } = await supabase.from('spot_tags').delete().eq('spot_id', spot.id);
  if (delTagError) throw delTagError;
  if (input.tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('spot_tags')
      .insert(input.tagIds.map((tagId) => ({ spot_id: spot.id, tag_id: tagId })));
    if (tagError) throw tagError;
  }

  // 画像: 残す指定のなかった既存画像は削除(Storage上のファイルも消す)、
  // 残す画像はposition を詰め直し、新規画像はその後ろに追加する
  const existingImages = spot.images ?? [];
  const removedImages = existingImages.filter((img) => !input.keepImageIds.includes(img.id));
  if (removedImages.length > 0) {
    const removedIds = removedImages.map((img) => img.id);
    const removedPaths = removedImages
      .flatMap((img) => [img.storage_path, img.thumbnail_path])
      .filter(Boolean) as string[];
    if (removedPaths.length > 0) {
      const { error: storageError } = await supabase.storage.from('spot-images').remove(removedPaths);
      if (storageError) console.warn('画像ファイル削除エラー', storageError);
    }
    const { error: delImgError } = await supabase.from('spot_images').delete().in('id', removedIds);
    if (delImgError) throw delImgError;
  }

  const keptImages = existingImages.filter((img) => input.keepImageIds.includes(img.id));
  for (let i = 0; i < keptImages.length; i++) {
    if (keptImages[i].position !== i) {
      const { error: posError } = await supabase.from('spot_images').update({ position: i }).eq('id', keptImages[i].id);
      if (posError) console.warn('画像position更新エラー', posError);
    }
  }

  if (input.newImagePaths.length > 0) {
    const { error: imgError } = await supabase.from('spot_images').insert(
      input.newImagePaths.map((img, i) => ({
        spot_id: spot.id,
        storage_path: img.path,
        thumbnail_path: img.thumbnailPath,
        position: keptImages.length + i,
      }))
    );
    if (imgError) throw imgError;
  }

  // SNS埋め込みもタグと同様、全削除してから入れ直す
  const { error: delEmbedError } = await supabase.from('spot_embeds').delete().eq('spot_id', spot.id);
  if (delEmbedError) throw delEmbedError;
  if (detectedEmbeds.length > 0) {
    const embedThumbnails = await embedThumbnailsPromise;
    const { error: embedError } = await supabase.from('spot_embeds').insert(
      detectedEmbeds.map((embed, i) => ({
        spot_id: spot.id,
        platform: embed!.platform,
        url: embed!.url,
        thumbnail_url: embedThumbnails[i] ?? null,
        position: i,
      }))
    );
    if (embedError) throw embedError;
  }

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

// 一覧のグリッド/カードに表示するサムネイルURLをまとめて解決する。
// 写真の投稿があればその1枚目、なければ埋め込み投稿(Instagram/X)から取得済みの
// サムネイルを使う。どちらもない場合はnullを返し、呼び出し側でテキストなどの
// プレースホルダー表示にフォールバックする。
export function spotThumbnailUrl(spot: Pick<Spot, 'images' | 'embeds'>): string | null {
  if (spot.images && spot.images.length > 0) {
    return spotImageThumbUrl(spot.images[0]);
  }
  const embedWithThumbnail = (spot.embeds ?? []).find((e) => e.thumbnail_url);
  return embedWithThumbnail?.thumbnail_url ?? null;
}

// join結果のネスト構造をフラットな Spot[] に整形する
function normalizeSpots(rows: any[]): Spot[] {
  return rows.map((row) => ({
    ...row,
    tags: (row.tags ?? []).map((t: any) => t.tag).filter(Boolean),
    embeds: [...(row.embeds ?? [])].sort((a: any, b: any) => a.position - b.position),
  }));
}
