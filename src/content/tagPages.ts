// タグ別ページ（/tags, /tags/<タグ名>）の共通定義。
// api/tag.ts（ページ本体）・api/sitemap.ts・api/spot.ts から使うため、
// React Native に依存しないプレーンなTSにしてある（api/page.ts と staticPages.ts と同じ考え方）。
// scripts/build-top-page.js（トップページの本文）は JS のため MIN_SPOTS_FOR_TAG_PAGE を二重管理している。

// この件数以上の公開スポットが付いたタグだけページを作る（中身の薄いページを増やさないため）
export const MIN_SPOTS_FOR_TAG_PAGE = 3;

export function tagPagePath(name: string): string {
  return `/tags/${encodeURIComponent(name)}`;
}

// supabase の spot_tags を tags / spots と結合して取得した1行
// （select 'tag:tags(id, name), spot:spots!inner(id, status, updated_at)' + spot.status = published）
export type TagSpotRow = {
  tag: { id: number; name: string } | { id: number; name: string }[] | null;
  spot: { id: string; updated_at: string } | { id: string; updated_at: string }[] | null;
};

export type TagSummary = {
  id: number;
  name: string;
  count: number;
  lastmod: string; // タグ内でいちばん新しいスポットの更新日時
  spotIds: string[];
};

export const TAG_SPOT_SELECT = 'tag:tags(id, name), spot:spots!inner(id, status, updated_at)';

// タグごとの公開スポット数などを集計する（件数の多い順）
export function summarizeTags(rows: TagSpotRow[]): TagSummary[] {
  const byId = new Map<number, TagSummary>();
  for (const row of rows) {
    const tag = Array.isArray(row.tag) ? row.tag[0] : row.tag;
    const spot = Array.isArray(row.spot) ? row.spot[0] : row.spot;
    if (!tag || !spot) continue;
    const entry = byId.get(tag.id) ?? { id: tag.id, name: tag.name, count: 0, lastmod: '', spotIds: [] };
    entry.count += 1;
    entry.spotIds.push(spot.id);
    if (spot.updated_at > entry.lastmod) entry.lastmod = spot.updated_at;
    byId.set(tag.id, entry);
  }
  return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
}

export function tagsWithPages(summaries: TagSummary[]): TagSummary[] {
  return summaries.filter((t) => t.count >= MIN_SPOTS_FOR_TAG_PAGE);
}

// Supabase(PostgREST)は1回の取得が最大1000行のため、range で区切って全件を取る
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) return all;
  }
}
