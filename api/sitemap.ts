// Vercel Serverless Function
// /sitemap.xml へのアクセスを vercel.json の rewrites で /api/sitemap にルーティングし、
// 公開済み(status = 'published')の全スポットのURLを含むsitemap.xmlを動的生成する。
// 以前は public/sitemap.xml がルートURL1件だけの静的ファイルだったため、
// 個別の投稿ページがGoogleにクロール候補として一切知らされていなかった。

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// SEO記事（public/articles/配下、content/articles.jsonから静的生成）のスラッグ一覧。
// 記事を追加した際は、content/articles.json の更新・scripts/generate-articles.js の再実行に
// あわせて、ここにもスラッグを追加する。
const ARTICLE_SLUGS = [
  'what-is-liminal-space',
  'liminal-spaces-in-japan',
  'liminal-space-vs-backrooms',
  'liminal-space-vs-dreamcore',
  'why-liminal-spaces-feel-scary',
  'history-of-liminal-space-trend',
  'how-to-find-liminal-spaces',
  'famous-liminal-spaces-around-the-world',
];

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
    { loc: 'https://limap.jp/about', changefreq: 'monthly', priority: '0.6' },
    { loc: 'https://limap.jp/help', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://limap.jp/articles/', changefreq: 'weekly', priority: '0.6' },
    ...ARTICLE_SLUGS.map((slug) => ({
      loc: `https://limap.jp/articles/${slug}/`,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];

  let spotUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase
        .from('spots')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(50000);

      if (!error && data) {
        spotUrls = data.map((row: { slug: string; updated_at: string }) => ({
          loc: `https://limap.jp/spot/${row.slug}`,
          lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
          changefreq: 'weekly',
          priority: '0.7',
        }));
      }
    }
  } catch {
    // Supabaseへの問い合わせに失敗しても、ルートURLだけのsitemapは返す
  }

  const urlEntries = [
    ...staticUrls.map(
      (u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...spotUrls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
  res.status(200).send(xml);
}
