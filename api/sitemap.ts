// Vercel Serverless Function
// /sitemap.xml へのアクセスを vercel.json の rewrites で /api/sitemap にルーティングし、
// 公開済み(status = 'published')の全スポットのURLを含むsitemap.xmlを動的生成する。
// 以前は public/sitemap.xml がルートURL1件だけの静的ファイルだったため、
// 個別の投稿ページがGoogleにクロール候補として一切知らされていなかった。

import { createClient } from '@supabase/supabase-js';
import {
  TAG_SPOT_SELECT,
  fetchAllRows,
  summarizeTags,
  tagPagePath,
  tagsWithPages,
  type TagSpotRow,
} from '../src/content/tagPages';
// SEO記事（public/articles/配下、content/articles.json から静的生成）とカテゴリ別一覧の一覧。
// npm run articles:build（scripts/generate-articles.js）が書き出すので、記事を足して生成し直せば自動で載る。
// カテゴリ別一覧は、記事が少なく noindex にしているものは含まれない。
import { isThinSpot } from '../src/content/spotSeo';
import articleIndex from '../src/content/articleIndex.json';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  const staticUrls = [
    { loc: 'https://limap.jp/', changefreq: 'daily', priority: '1.0' },
    { loc: 'https://limap.jp/japan', changefreq: 'daily', priority: '0.9' },
    { loc: 'https://limap.jp/about', changefreq: 'monthly', priority: '0.6' },
    { loc: 'https://limap.jp/help', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://limap.jp/privacy', changefreq: 'yearly', priority: '0.3' },
    { loc: 'https://limap.jp/terms', changefreq: 'yearly', priority: '0.3' },
    { loc: 'https://limap.jp/tags', changefreq: 'weekly', priority: '0.5' },
  ];

  // 記事・記事一覧は、articles.json の公開日・更新日を lastmod にする
  const latestArticle = articleIndex.articles.map((a) => a.lastmod).sort().pop() ?? '';
  const articleUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];
  // 英語版（scripts/generate-articles.js が public/en/articles/ に生成。日本語版と hreflang で結んでいる）
  for (const [prefix, priority] of [
    ['https://limap.jp/articles/', '0.6'],
    ['https://limap.jp/en/articles/', '0.5'],
  ] as const) {
    articleUrls.push({ loc: prefix, lastmod: latestArticle, changefreq: 'weekly', priority });
    for (const c of articleIndex.categories) {
      articleUrls.push({ loc: `${prefix}category/${c.slug}/`, lastmod: c.lastmod ?? latestArticle, changefreq: 'weekly', priority: '0.4' });
    }
    for (const a of articleIndex.articles) {
      articleUrls.push({ loc: `${prefix}${a.slug}/`, lastmod: a.lastmod, changefreq: 'monthly', priority });
    }
  }

  let spotUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];
  let tagUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase
        .from('spots')
        .select('slug, updated_at, description, title_en, description_en, images:spot_images(count), reviews:spot_reviews(count)')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(50000);

      if (!error && data) {
        type SpotRow = {
          slug: string;
          updated_at: string;
          description: string | null;
          title_en: string | null;
          description_en: string | null;
          images: { count: number }[];
          reviews: { count: number }[];
        };
        // 中身の薄いスポット（noindex にしているページ）は載せない
        const indexable = (data as SpotRow[]).filter(
          (row) =>
            !isThinSpot({
              description: row.description,
              imageCount: row.images?.[0]?.count ?? 0,
              reviewCount: row.reviews?.[0]?.count ?? 0,
            })
        );
        spotUrls = indexable.map((row) => ({
          loc: `https://limap.jp/spot/${row.slug}`,
          lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
          changefreq: 'weekly',
          priority: '0.7',
        }));
        // 英語の名前と説明文がある公式スポットは、英語のページ（api/spot-en.ts）も載せる
        spotUrls.push(
          ...indexable
            .filter((row) => row.title_en && row.description_en)
            .map((row) => ({
              loc: `https://limap.jp/en/spot/${row.slug}`,
              lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
              changefreq: 'weekly',
              priority: '0.6',
            }))
        );
      }
    }
  } catch {
    // Supabaseへの問い合わせに失敗しても、ルートURLだけのsitemapは返す
  }

  // タグ別ページ（api/tag.ts）。更新日はタグ内でいちばん新しいスポットの更新日
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const rows = await fetchAllRows<TagSpotRow>((from, to) =>
        supabase.from('spot_tags').select(TAG_SPOT_SELECT).eq('spot.status', 'published').range(from, to)
      );
      tagUrls = tagsWithPages(summarizeTags(rows)).map((t) => ({
        loc: `https://limap.jp${tagPagePath(t.name)}`,
        lastmod: new Date(t.lastmod).toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: '0.5',
      }));
    }
  } catch {
    // タグの集計に失敗しても、他のURLは返す
  }

  const urlEntries = [
    ...staticUrls.map(
      (u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...[...articleUrls, ...spotUrls, ...tagUrls].map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
  res.status(200).send(xml);
}
