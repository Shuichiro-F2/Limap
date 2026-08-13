// Vercel Serverless Function
// /spot/:id へのアクセスを vercel.json の rewrites で /api/spot?id=:id にルーティングし、
// ここで「そのスポット固有」のtitle/description/OGP/Twitter Card/canonical/JSON-LD(Place)を
// 埋め込んだHTMLを返す。SPA自体（同じJSバンドル）はそのまま読み込むので、
// 通常ユーザーの表示・挙動は一切変わらない（クローラー/SNSシェア向けの初期HTMLだけが変わる）。
//
// なぜこうするか:
// - vercel.json は全ルートを /index.html にrewriteする静的SPAのため、
//   これまでは /spot/xxxx へのアクセスも常に同じ汎用のtitle/meta/OGPしか返せなかった。
// - クローラーやSNSの展開（LINE/X/Facebookなど）の多くはJSを実行しない、
//   または実行が不安定なため、最初のHTMLレスポンス自体にスポット固有の情報が
//   含まれている必要がある。

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const SITE_NAME = 'LIMap（リマップ）';
const DEFAULT_OG_IMAGE = 'https://limap.jp/og-image.png';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function replaceTag(html: string, regex: RegExp, replacement: string): string {
  return regex.test(html) ? html.replace(regex, replacement) : html;
}

export default async function handler(req: any, res: any) {
  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;

  try {
    const baseHtmlRes = await fetch(`${origin}/index.html`);
    let html = await baseHtmlRes.text();

    if (!id || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: spot, error } = await supabase
      .from('spots')
      .select(
        `
        id, title, description, lat, lng, country, city, status, created_at, updated_at,
        images:spot_images(storage_path, position),
        author:profiles!spots_author_id_fkey(username, display_name)
      `
      )
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !spot) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(spot === null ? 404 : 200).send(html);
      return;
    }

    // `!fkey`指定の多対1joinは実行時には単一オブジェクトで返るが、
    // supabase-jsの型推論では配列と推定されるためanyで受ける
    const author = (Array.isArray(spot.author) ? spot.author[0] : spot.author) as
      | { username?: string; display_name?: string | null }
      | undefined;

    const place = [spot.city, spot.country].filter(Boolean).join(', ');
    const rawTitle = (spot.title || '').trim() || (spot.description || '').trim().slice(0, 40) || '無題の投稿';
    const pageTitle = `${truncate(rawTitle, 40)} | ${SITE_NAME}`;
    const descBase =
      (spot.description || '').trim() ||
      'リミナルスペースを記録した投稿です。写真と場所の詳細はLIMapでご覧いただけます。';
    const pageDescription = truncate(place ? `${place}にあるリミナルスペースの記録。${descBase}` : descBase, 120);

    const images = (spot.images || []) as { storage_path: string; position: number }[];
    const sortedImages = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const firstImagePath = sortedImages[0]?.storage_path;
    const ogImage = firstImagePath
      ? supabase.storage.from('spot-images').getPublicUrl(firstImagePath).data.publicUrl
      : DEFAULT_OG_IMAGE;

    const pageUrl = `https://limap.jp/spot/${spot.id}`;
    const escTitle = escapeHtml(pageTitle);
    const escDesc = escapeHtml(pageDescription);
    const escImage = escapeHtml(ogImage);
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
      /<meta property="og:image" content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${escImage}" />`
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
    html = replaceTag(
      html,
      /<meta name="twitter:image" content="[^"]*"\s*\/>/,
      `<meta name="twitter:image" content="${escImage}" />`
    );

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: rawTitle,
      description: descBase,
      url: pageUrl,
      image: ogImage,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: spot.lat,
        longitude: spot.lng,
      },
      ...(place ? { address: { '@type': 'PostalAddress', addressLocality: spot.city || undefined, addressCountry: spot.country || undefined } } : {}),
      dateCreated: spot.created_at,
      dateModified: spot.updated_at,
      ...(author?.username
        ? { author: { '@type': 'Person', name: author.display_name || author.username } }
        : {}),
    };
    const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`;
    html = html.replace(/<\/head>/, jsonLdScript);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
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
