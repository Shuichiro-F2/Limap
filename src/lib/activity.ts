import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// アプリ内のお知らせ（マイページのベルの印から開く）。
// 自分の投稿へのいいね・行ってきた投稿と、新しいフォロワーを、新しい順に並べる。
// どれも誰でも読めるデータ（likes・spot_reviews・follows）から作るので、DB の変更は要らない。
// プッシュ通知ではない（プッシュ通知はネイティブの再ビルドが要るため）。

export type ActivityActor = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };

export type ActivityItem =
  | { kind: 'like'; at: string; actor: ActivityActor; spotSlug: string; spotTitle: string }
  | { kind: 'review'; at: string; actor: ActivityActor; spotSlug: string; spotTitle: string }
  | { kind: 'follow'; at: string; actor: ActivityActor };

const ACTOR = 'id, username, display_name, avatar_url';
const LIMIT = 50;

export async function fetchActivity(userId: string): Promise<ActivityItem[]> {
  const { data: mySpots, error: spotsError } = await supabase
    .from('spots')
    .select('id, slug, title')
    .eq('author_id', userId);
  if (spotsError) throw spotsError;
  const spotById = new Map((mySpots ?? []).map((s: any) => [s.id, s]));
  const spotIds = [...spotById.keys()];

  const [likes, reviews, follows] = await Promise.all([
    spotIds.length
      ? supabase
          .from('likes')
          .select(`spot_id, created_at, user:profiles!likes_user_id_fkey(${ACTOR})`)
          .in('spot_id', spotIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
    spotIds.length
      ? supabase
          .from('spot_reviews')
          .select(`spot_id, created_at, author:profiles!spot_reviews_author_id_fkey(${ACTOR})`)
          .in('spot_id', spotIds)
          .neq('author_id', userId)
          .order('created_at', { ascending: false })
          .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('follows')
      .select(`created_at, follower:profiles!follows_follower_id_fkey(${ACTOR})`)
      .eq('followee_id', userId)
      .order('created_at', { ascending: false })
      .limit(LIMIT),
  ]);

  const one = (x: any) => (Array.isArray(x) ? x[0] : x);
  const items: ActivityItem[] = [];
  for (const r of (likes.data ?? []) as any[]) {
    const spot = spotById.get(r.spot_id);
    const actor = one(r.user);
    if (spot && actor) items.push({ kind: 'like', at: r.created_at, actor, spotSlug: spot.slug, spotTitle: spot.title });
  }
  for (const r of (reviews.data ?? []) as any[]) {
    const spot = spotById.get(r.spot_id);
    const actor = one(r.author);
    if (spot && actor) items.push({ kind: 'review', at: r.created_at, actor, spotSlug: spot.slug, spotTitle: spot.title });
  }
  for (const r of (follows.data ?? []) as any[]) {
    const actor = one(r.follower);
    if (actor) items.push({ kind: 'follow', at: r.created_at, actor });
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, LIMIT);
}

// 最後にお知らせを開いた時刻（この端末に覚えておく）。これより新しいものがあれば、ベルに印を付ける
const seenKey = (userId: string) => `limap.activitySeenAt.${userId}`;

export async function getActivitySeenAt(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(seenKey(userId));
  } catch {
    return null;
  }
}

export async function markActivitySeen(userId: string, at: string = new Date().toISOString()) {
  await AsyncStorage.setItem(seenKey(userId), at).catch(() => {});
}
