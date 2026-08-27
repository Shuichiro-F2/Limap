import { supabase } from './supabase';
import type { ReportReason, Block, Profile } from '../types/database';

// スポット本体の通報(reportSpot)はsrc/lib/spots.tsに既存のものがある。
// ここではレビュー投稿・ユーザーアカウントの通報と、ユーザーブロック機能をまとめる。

export async function reportReview(reporterId: string, reviewId: string, reason: ReportReason, note?: string) {
  const { error } = await supabase.from('reports').insert({
    target_type: 'review',
    review_id: reviewId,
    reporter_id: reporterId,
    reason,
    note: note ?? null,
  });
  if (error) throw error;
}

export async function reportUser(reporterId: string, reportedUserId: string, reason: ReportReason, note?: string) {
  const { error } = await supabase.from('reports').insert({
    target_type: 'user',
    reported_user_id: reportedUserId,
    reporter_id: reporterId,
    reason,
    note: note ?? null,
  });
  if (error) throw error;
}

const BLOCKED_PROFILE_SELECT = `
  *,
  blocked:profiles!blocks_blocked_id_fkey(id, username, display_name, avatar_url, badge_type_key, badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color))
`;

// マイページ「ブロック中のユーザー」一覧用
export async function fetchBlockedUsers(blockerId: string): Promise<Block[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select(BLOCKED_PROFILE_SELECT)
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// フィード・検索・地図・レビュー表示からの除外フィルタ用に、
// 自分がブロックしているユーザーのIDだけを軽量に取得する
export async function fetchBlockedUserIds(blockerId: string): Promise<string[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', blockerId);
  if (error) throw error;
  return (data ?? []).map((row) => row.blocked_id);
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw error;
}

// Spot[]やSpotReview[]など、author(またはauthor_id)を持つ配列から
// ブロック済みユーザーの投稿を取り除く共通ヘルパー
export function filterBlockedAuthors<T extends { author_id?: string; author?: Profile | null }>(
  items: T[],
  blockedUserIds: Set<string>
): T[] {
  if (blockedUserIds.size === 0) return items;
  return items.filter((item) => {
    const authorId = item.author_id ?? item.author?.id;
    return !authorId || !blockedUserIds.has(authorId);
  });
}
