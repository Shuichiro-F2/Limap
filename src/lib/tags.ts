import { supabase } from './supabase';
import { TAG_SPOT_SELECT, fetchAllRows, summarizeTags, type TagSpotRow } from '../content/tagPages';
import type { Tag } from '../types/database';

export type TagWithCount = Tag & { count: number };

// 公開スポットが1件以上付いたタグを、件数つき・件数の多い順で返す（検索タブの一覧用）。
// 集計はタグ別ページ(api/tag.ts)と同じ処理を使う
export async function fetchTagsWithCounts(): Promise<TagWithCount[]> {
  const rows = await fetchAllRows<TagSpotRow>((from, to) =>
    supabase.from('spot_tags').select(TAG_SPOT_SELECT).eq('spot.status', 'published').range(from, to)
  );
  return summarizeTags(rows).map((t) => ({ id: t.id, name: t.name, count: t.count }));
}

// タグは固定リストではなく、ユーザーが自由に追加できるマスタデータ。
// 投稿時の候補表示や検索タブの絞り込みチップに使う。
export async function fetchAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

// 既存タグがあればそれを返し、なければ新規作成する（name はDB側でユニーク制約）
export async function findOrCreateTag(name: string): Promise<Tag> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('タグ名を入力してください');

  const { data: existing, error: findError } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', trimmed)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('tags')
    .insert({ name: trimmed })
    .select('id, name')
    .single();

  if (insertError) {
    // 同時作成などでユニーク制約に引っかかった場合は、既存タグを取り直す
    const { data: fallback, error: fallbackError } = await supabase
      .from('tags')
      .select('id, name')
      .ilike('name', trimmed)
      .maybeSingle();
    if (fallback) return fallback;
    throw fallbackError ?? insertError;
  }

  return created;
}
