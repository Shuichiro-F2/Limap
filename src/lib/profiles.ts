import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { resizeImageForUpload } from './imageResize';
import type { Profile } from '../types/database';

// ユーザープロフィール画面用: idからプロフィールを1件取得する
export async function fetchProfileById(id: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// avatarsバケットのstorage_pathから公開URLを組み立てる
export function avatarImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}

// 表示名・自己紹介文の更新（ユーザーID/usernameとは別に編集できる項目）
export async function updateProfile(
  userId: string,
  updates: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null }
) {
  const payload: Record<string, string | null> = {};
  if ('displayName' in updates) payload.display_name = updates.displayName ?? null;
  if ('bio' in updates) payload.bio = updates.bio ?? null;
  if ('avatarUrl' in updates) payload.avatar_url = updates.avatarUrl ?? null;

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
}

// プロフィール画像をavatarsバケットへアップロードし、公開URLを返す。
// 投稿画像のアップロード（CreateSpotScreen）と同じ縮小・圧縮ヘルパーを再利用する。
export async function uploadAvatar(userId: string, uri: string, base64: string): Promise<string> {
  const resized = await resizeImageForUpload(uri, base64);
  if (!resized) throw new Error('画像の処理に失敗しました');

  // 常に同じパスに上書きすることで、古いアバター画像がストレージに残り続けるのを防ぐ
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(resized.base64), { contentType: resized.contentType, upsert: true });
  if (error) throw error;

  // 同じパスのままだとCDN/ブラウザキャッシュにより更新後も古い画像が表示され続けることがあるため、
  // クエリパラメータでキャッシュを回避する
  return `${avatarImageUrl(path)}?t=${Date.now()}`;
}

// フォロワー一覧・フォロー中一覧（FollowListScreen用）
export async function fetchFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(*)')
    .eq('followee_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.follower).filter(Boolean);
}

export async function fetchFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee:profiles!follows_followee_id_fkey(*)')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.followee).filter(Boolean);
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
