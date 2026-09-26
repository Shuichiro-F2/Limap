// Vercel Serverless Function
// タグ別ページ。vercel.json の rewrites で
//   /tags        → /api/tag            （タグ一覧）
//   /tags/<タグ名> → /api/tag?tag=<タグ名>（そのタグのスポット一覧）
// にルーティングする。
//
// ユーザーの投稿が増えるほどページの中身も増えるよう、DBのタグから自動で作る。
// 公開スポットが MIN_SPOTS_FOR_TAG_PAGE 件以上付いたタグだけを対象にし、それ以外は404にする。
// 記事ページ(public/articles)と同じく、アプリ(SPA)を読み込まない独立したHTMLページにしている
// （アプリ側にこのURLの画面は無いため。クローラーとユーザーが同じ内容を見られるようにする）。

import { createClient } from '@supabase/supabase-js';
import {
  MIN_SPOTS_FOR_TAG_PAGE,
  TAG_SPOT_SELECT,
  fetchAllRows,
  summarizeTags,
  tagPagePath,
  tagsWithPages,
  type TagSpotRow,
  type TagSummary,
} from '../src/content/tagPages';
import {
  CHIP_STYLE,
  SITE_NAME,
  SITE_URL,
  breadcrumbJsonLd,
  escapeHtml,
  excerpt,
  renderPage,
  spotTitle,
  tagChips,
} from '../src/content/ssrPage';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 1ページに並べるスポットの上限。超えた分は件数だけ示し、地図へ誘導する
const MAX_SPOTS_ON_PAGE = 100;
const MAX_RELATED_TAGS = 8;

function renderIndexPage(tags: TagSummary[]): string {
  const url = `${SITE_URL}/tags`;
  const title = `タグからリミナルスペースを探す | ${SITE_NAME}`;
  const description = `廃工場、駅、団地、廃校など、LIMapに登録されたリミナルスペースをタグ別に一覧できます。${tags
    .slice(0, 6)
    .map((t) => t.name)
    .join('、')}などのタグがあります。`;
  const body = `${CHIP_STYLE}
      <h1 class="article-title">タグから探す</h1>
      <p class="hub-lead">LIMapに登録されたリミナルスペースを、タグ別に一覧できます（スポットが${MIN_SPOTS_FOR_TAG_PAGE}件以上のタグ）。</p>
      <p class="hub-lead" lang="en">Browse liminal spaces on LIMap by tag.</p>
      <div class="tag-chips">
${tagChips(tags)}
      </div>`;
  return renderPage({
    title,
    description,
    url,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url,
        inLanguage: 'ja',
      },
      breadcrumbJsonLd([
        { name: 'LIMap', url: `${SITE_URL}/` },
        { name: 'タグ一覧', url },
      ]),
    ],
  });
}

type TagSpot = {
  slug: string;
  title: string | null;
  description: string | null;
  created_at: string;
  images: { storage_path: string; thumbnail_path: string | null; position: number }[] | null;
};

function renderTagPage(
  tag: TagSummary,
  spots: TagSpot[],
  related: TagSummary[],
  imageUrl: (path: string) => string
): string {
  const url = `${SITE_URL}${tagPagePath(tag.name)}`;
  const shown = spots.slice(0, MAX_SPOTS_ON_PAGE);
  const title = `#${tag.name} のスポット一覧（${tag.count}件） | ${SITE_NAME}`;
  const description = excerpt(
    `LIMapに登録された「${tag.name}」タグのリミナルスペース${tag.count}件。${shown
      .slice(0, 3)
      .map(spotTitle)
      .join('、')}など、写真と場所で紹介します。`,
    120
  );

  const items = shown
    .map((s) => {
      const image = [...(s.images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
      const img = image
        ? `<img class="card-thumb" src="${escapeHtml(imageUrl(image.thumbnail_path || image.storage_path))}" alt="${escapeHtml(
            spotTitle(s)
          )}" loading="lazy" />`
        : '';
      return `        <a href="/spot/${encodeURIComponent(s.slug)}">
          ${img}
          <p class="hub-item-title">${escapeHtml(spotTitle(s))}</p>
          ${s.description ? `<p class="hub-item-desc">${escapeHtml(excerpt(s.description, 80))}</p>` : ''}
        </a>`;
    })
    .join('\n');

  const more =
    tag.count > shown.length
      ? `      <p class="tag-note">ほかにも${tag.count - shown.length}件あります。LIMapの地図でご覧ください。 / ${
          tag.count - shown.length
        } more on the LIMap map.</p>\n`
      : '';

  const relatedBlock = related.length
    ? `      <h2 class="section-heading">関連するタグ / Related tags</h2>
      <div class="tag-chips">
${tagChips(related)}
      </div>\n`
    : '';

  const body = `${CHIP_STYLE}
      <span class="article-category">タグ / Tag</span>
      <h1 class="article-title">#${escapeHtml(tag.name)} のリミナルスペース</h1>
      <p class="hub-lead">LIMapに登録された、「${escapeHtml(tag.name)}」タグの付いたリミナルスペース${
        tag.count
      }件の一覧です。スポットのページで、写真や場所、アクセスを確認できます。</p>
      <p class="hub-lead" lang="en">${tag.count} liminal spaces tagged “${escapeHtml(
        tag.name
      )}” on LIMap. Open a spot to see its photos, location and how to get there.</p>
      <div class="hub-list">
${items}
      </div>
${more}      <p class="tag-cta"><a href="${SITE_URL}/">LIMapの地図でリミナルスペースを探す / Explore the map</a></p>
${relatedBlock}      <p><a href="${SITE_URL}/tags">タグ一覧へ / All tags</a></p>`;

  return renderPage({
    title,
    description,
    url,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url,
        inLanguage: 'ja',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: tag.count,
          itemListElement: shown.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/spot/${s.slug}`,
            name: spotTitle(s),
          })),
        },
      },
      breadcrumbJsonLd([
        { name: 'LIMap', url: `${SITE_URL}/` },
        { name: 'タグ一覧', url: `${SITE_URL}/tags` },
        { name: `#${tag.name}`, url },
      ]),
    ],
  });
}

function renderNotFound(): string {
  return renderPage({
    title: `タグが見つかりません | ${SITE_NAME}`,
    description: 'このタグのページはありません。',
    url: `${SITE_URL}/tags`,
    noindex: true,
    jsonLd: [],
    body: `      <h1 class="article-title">このタグのページはありません</h1>
      <p class="hub-lead">タグ別ページは、スポットが${MIN_SPOTS_FOR_TAG_PAGE}件以上あるタグだけにあります。 / This tag has no page.</p>
      <p><a href="${SITE_URL}/tags">タグ一覧へ / All tags</a></p>`,
  });
}

// 関連するタグ: このタグのスポットに一緒に付いていることが多いタグ（ページがあるものだけ）
function relatedTags(tag: TagSummary, rows: TagSpotRow[], pageTags: TagSummary[]): TagSummary[] {
  const spotIds = new Set(tag.spotIds);
  const coCount = new Map<number, number>();
  for (const row of rows) {
    const t = Array.isArray(row.tag) ? row.tag[0] : row.tag;
    const s = Array.isArray(row.spot) ? row.spot[0] : row.spot;
    if (!t || !s || t.id === tag.id || !spotIds.has(s.id)) continue;
    coCount.set(t.id, (coCount.get(t.id) ?? 0) + 1);
  }
  return pageTags
    .filter((t) => coCount.has(t.id))
    .sort((a, b) => (coCount.get(b.id) ?? 0) - (coCount.get(a.id) ?? 0))
    .slice(0, MAX_RELATED_TAGS);
}

function sendHtml(res: any, status: number, html: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (status === 200) {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  }
  res.status(status).send(html);
}

export default async function handler(req: any, res: any) {
  const tagParam = req.query?.tag;
  const rawTag: string | undefined = Array.isArray(tagParam) ? tagParam[0] : tagParam;
  let tagName = rawTag;
  if (tagName && /%[0-9A-Fa-f]{2}/.test(tagName)) {
    try {
      tagName = decodeURIComponent(tagName);
    } catch {
      // 不正なエンコードはそのまま扱う（該当タグ無しで404になる）
    }
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase is not configured');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const rows = await fetchAllRows<TagSpotRow>((from, to) =>
      supabase.from('spot_tags').select(TAG_SPOT_SELECT).eq('spot.status', 'published').range(from, to)
    );
    const pageTags = tagsWithPages(summarizeTags(rows));

    if (!tagName) {
      sendHtml(res, 200, renderIndexPage(pageTags));
      return;
    }

    const tag = pageTags.find((t) => t.name === tagName);
    if (!tag) {
      sendHtml(res, 404, renderNotFound());
      return;
    }

    const spotRows = await fetchAllRows<{ spot: TagSpot | TagSpot[] | null }>((from, to) =>
      supabase
        .from('spot_tags')
        .select(
          'spot:spots!inner(slug, title, description, created_at, status, images:spot_images(storage_path, thumbnail_path, position))'
        )
        .eq('tag_id', tag.id)
        .eq('spot.status', 'published')
        .range(from, to)
    );
    const spots = spotRows
      .map((r) => (Array.isArray(r.spot) ? r.spot[0] : r.spot))
      .filter((s): s is TagSpot => !!s)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    const imageUrl = (path: string) => supabase.storage.from('spot-images').getPublicUrl(path).data.publicUrl;
    sendHtml(res, 200, renderTagPage(tag, spots, relatedTags(tag, rows, pageTags), imageUrl));
  } catch {
    res.status(500).send('Internal Server Error');
  }
}
