// Vercel Serverless Function
// /about, /help へのアクセスを vercel.json の rewrites で /api/page?slug=about|help に
// ルーティングし、各ページ固有のtitle/description/OGP/canonical/FAQPage(JSON-LD)を
// 埋め込んだHTMLを返す。あわせて #root の中に本文（見出し・各セクション・FAQ）も入れる。
// api/spot.tsと同じ考え方で、内容はDBではなく src/content/staticPages.ts の静的データを使う。

import { STATIC_PAGES, type StaticPageContent } from '../src/content/staticPages';

const SITE_NAME = 'LIMap（リマップ）';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceTag(html: string, regex: RegExp, replacement: string): string {
  return regex.test(html) ? html.replace(regex, replacement) : html;
}

// 改行を段落/改行タグにする（エスケープ済みの文字列を返す）
function toParagraphs(str: string): string {
  return str
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

const PAGE_LINKS: { slug: StaticPageContent['slug']; label: string }[] = [
  { slug: 'about', label: 'リミナルスペースとは / About' },
  { slug: 'help', label: '使い方 / Help' },
  { slug: 'privacy', label: 'プライバシーポリシー / Privacy' },
  { slug: 'terms', label: '利用規約 / Terms' },
];

// #root の中に入れる本文HTML。アプリの StaticContentScreen と同じ構成
// （見出し・リード文・各セクション・よくある質問）。
// 通常のブラウザではロード画面が覆っている間に React が #root を置き換えるため、見た目は変わらない。
function buildPageBody(page: StaticPageContent): string {
  const parts: string[] = [];
  parts.push(`<h1>${escapeHtml(page.heading)}</h1>`);
  parts.push(toParagraphs(page.lead));
  for (const section of page.sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    parts.push(toParagraphs(section.body));
  }
  if (page.faq.length > 0) {
    const items = page.faq
      .map((item) => `<dt>Q. ${escapeHtml(item.question)}</dt><dd>A. ${escapeHtml(item.answer)}</dd>`)
      .join('');
    parts.push(`<h2>よくある質問 / FAQ</h2>\n<dl>${items}</dl>`);
  }
  const links = [
    '<a href="/">LIMapの地図でリミナルスペースを探す / Explore the map</a>',
    '<a href="/japan">日本のリミナルスペース一覧 / Liminal spaces in Japan</a>',
    '<a href="/articles/">コラム / Articles</a>',
    ...PAGE_LINKS.filter((l) => l.slug !== page.slug).map((l) => `<a href="/${l.slug}">${l.label}</a>`),
  ];
  parts.push(`<nav>${links.join(' ・ ')}</nav>`);
  return `<main id="limap-ssr">\n${parts.join('\n')}\n</main>`;
}

export default async function handler(req: any, res: any) {
  const slugParam = req.query?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;

  try {
    // index.html はトップページの本文入りのため、本文の無いひな形 app.html を使う（scripts/build-top-page.js）
    const baseHtmlRes = await fetch(`${origin}/app.html`);
    let html = await baseHtmlRes.text();

    const page: StaticPageContent | null =
      slug === 'about' || slug === 'help' || slug === 'privacy' || slug === 'terms'
        ? STATIC_PAGES[slug as 'about' | 'help' | 'privacy' | 'terms']
        : null;
    if (!page) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
      return;
    }

    const pageTitle = `${page.metaTitle} | ${SITE_NAME}`;
    const pageUrl = `https://limap.jp/${page.path}`;
    const escTitle = escapeHtml(pageTitle);
    const escDesc = escapeHtml(page.metaDescription);
    const escUrl = escapeHtml(pageUrl);

    html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${escTitle}</title>`);
    html = replaceTag(
      html,
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escDesc}" />`
    );
    html = replaceTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escUrl}" />`);
    html = replaceTag(
      html,
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${escUrl}" />`
    );
    html = replaceTag(
      html,
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escTitle}" />`
    );
    html = replaceTag(
      html,
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escDesc}" />`
    );
    html = replaceTag(
      html,
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escTitle}" />`
    );
    html = replaceTag(
      html,
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${escDesc}" />`
    );

    // FAQが無いページ（Privacy/Terms等）ではFAQPageの構造化データを埋め込まない
    // （mainEntityが空のFAQPageは無意味かつSearch Consoleで警告の対象になり得るため）
    if (page.faq.length > 0) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      };
      const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`;
      html = html.replace(/<\/head>/, jsonLdScript);
    }

    // 置換文字列中の $ が特殊扱いされないよう関数で渡す
    html = html.replace(/<div id="root"><\/div>/, () => `<div id="root">${buildPageBody(page)}</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (e) {
    try {
      const fallbackRes = await fetch(`${origin}/app.html`);
      const fallbackHtml = await fallbackRes.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(fallbackHtml);
    } catch {
      res.status(500).send('Internal Server Error');
    }
  }
}
