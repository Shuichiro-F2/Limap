// Vercel Serverless Function
// /about, /help へのアクセスを vercel.json の rewrites で /api/page?slug=about|help に
// ルーティングし、各ページ固有のtitle/description/OGP/canonical/FAQPage(JSON-LD)を
// 埋め込んだHTMLを返す。api/spot.tsと同じ考え方で、内容はDBではなく
// src/content/staticPages.ts の静的データを使う。

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

export default async function handler(req: any, res: any) {
  const slugParam = req.query?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;

  try {
    const baseHtmlRes = await fetch(`${origin}/index.html`);
    let html = await baseHtmlRes.text();

    const page: StaticPageContent | null =
      slug === 'about' || slug === 'help' ? STATIC_PAGES[slug as 'about' | 'help'] : null;
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

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (e) {
    try {
      const fallbackRes = await fetch(`${origin}/index.html`);
      const fallbackHtml = await fallbackRes.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(fallbackHtml);
    } catch {
      res.status(500).send('Internal Server Error');
    }
  }
}
