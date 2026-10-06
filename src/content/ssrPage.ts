// サーバー側で組み立てる独立HTMLページ（api/tag.ts のタグ別ページ、api/japan.ts の日本の一覧ページ）の共通部品。
// 記事ページ(public/articles/assets/article.css)と同じ見た目にする。
// api から読むため、React Native に依存しないプレーンなTSにしてある。

import { tagPagePath } from './tagPages';

export const SITE_URL = 'https://limap.jp';
export const SITE_NAME = 'LIMap（リマップ）';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeJsonLd(obj: unknown): string {
  // </script> によるHTML解釈崩れを防ぐ
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export function excerpt(str: string, max: number): string {
  const s = str.replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function spotTitle(spot: { title: string | null; description: string | null }): string {
  // api/spot.ts の rawTitle と同じ決め方（改行は空白にまとめる）
  return ((spot.title || '').trim() || (spot.description || '').trim().slice(0, 40) || '無題の投稿').replace(/\s+/g, ' ');
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  };
}

// タグのリンク（丸いチップ）。件数つき
export function tagChips(tags: { name: string; count: number }[]): string {
  return tags
    .map((t) => `<a class="tag-chip" href="${tagPagePath(t.name)}">#${escapeHtml(t.name)}<span>${t.count}</span></a>`)
    .join('\n');
}

// タグのチップ・注記・誘導リンク用の追加スタイル（記事ページのCSS変数を使う）
export const CHIP_STYLE = `      <style>
        .tag-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 28px; }
        .tag-chip { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border: 1px solid var(--border); border-radius: 999px; color: var(--text-primary); text-decoration: none; font-size: 14px; }
        .tag-chip span { color: var(--text-muted); font-size: 12px; }
        .tag-note { color: var(--text-secondary); font-size: 14px; }
        .tag-cta { margin: 28px 0; }
        .tag-cta a { color: var(--accent); }
      </style>`;

export function renderPage(opts: {
  title: string;
  description: string;
  url: string;
  jsonLd: unknown[];
  body: string;
  noindex?: boolean;
  // 英語のページ（/en/spot/... など）のとき 'en'。html の lang・og:locale・フッターを英語にする
  lang?: 'ja' | 'en';
  // 共有したときの画像（省略すると共通の画像）
  image?: string;
  // 日英の対応するページ（hreflang）
  alternates?: { hreflang: string; href: string }[];
}): string {
  const en = opts.lang === 'en';
  const alternateTags = (opts.alternates ?? [])
    .map((a) => `    <link rel="alternate" hreflang="${escapeHtml(a.hreflang)}" href="${escapeHtml(a.href)}" />\n`)
    .join('');
  const jsonLdTags = opts.jsonLd
    .map((d) => `    <script type="application/ld+json">${escapeJsonLd(d)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'ja'}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <title>${escapeHtml(opts.title)}</title>
    <meta name="description" content="${escapeHtml(opts.description)}" />
    <meta name="robots" content="${opts.noindex ? 'noindex' : 'max-image-preview:large'}" />
    <link rel="canonical" href="${escapeHtml(opts.url)}" />
${alternateTags}    <meta name="theme-color" content="#1a1a1a" />
    <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="icon" href="${SITE_URL}/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LIMap" />
    <meta property="og:url" content="${escapeHtml(opts.url)}" />
    <meta property="og:title" content="${escapeHtml(opts.title)}" />
    <meta property="og:description" content="${escapeHtml(opts.description)}" />
    <meta property="og:image" content="${escapeHtml(opts.image ?? `${SITE_URL}/og-image.png`)}" />
    <meta property="og:locale" content="${en ? 'en_US' : 'ja_JP'}" />
${jsonLdTags}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=DotGothic16&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/articles/assets/article.css?v=3" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${SITE_URL}/">
        <img src="/articles/assets/logo-header.png" alt="LIMap" class="brand-logo" />
      </a>
    </header>
    <main>
${opts.body}
    </main>
    <footer class="site-footer">
${
  en
    ? `      <a href="${SITE_URL}/">LIMap home</a>
      <a href="${SITE_URL}/en/articles/">Articles</a>
      <a href="${SITE_URL}/en/articles/what-is-liminal-space/">What is a liminal space?</a>`
    : `      <a href="${SITE_URL}/">LIMapトップへ</a>
      <a href="${SITE_URL}/japan">日本のリミナルスペース一覧</a>
      <a href="${SITE_URL}/tags">タグ一覧</a>
      <a href="${SITE_URL}/articles/">記事一覧</a>
      <a href="${SITE_URL}/about">リミナルスペースとは</a>`
}
    </footer>
  </body>
</html>
`;
}
