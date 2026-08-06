import { supabase } from './supabase';
import type { Profile } from '../types/database';

// ユーザープロフィール画面用: idからプロフィールを1件取得する
export async function fetchProfileById(id: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// フォロワー数・フォロー数をまとめて取得する
export async function fetchFollowCounts(userId: string): Promise<FollowCounts> {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', userId),
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  if (followersRes.error) throw followersRes.error;
  if (followingRes.error) throw followingRes.error;
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

// 自分(followerId)が相手(followeeId)をフォロー済みかどうか
export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleFollow(followerId: string, followeeId: string, currentlyFollowing: boolean) {
  if (currentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
    if (error) throw error;
  }
}
