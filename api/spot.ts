// Vercel Serverless Function
// /spot/:id へのアクセスを vercel.json の rewrites で /api/spot?id=:id にルーティングし、
// ここで「そのスポット固有」のtitle/description/OGP/Twitter Card/canonical/JSON-LD(Place)を
// 埋め込んだHTMLを返す。あわせて #root の中にスポットの本文（タイトル・写真・説明・アクセス等）も入れる。
// SPA自体（同じJSバンドル）はそのまま読み込むので、
// 通常ユーザーの表示・挙動は一切変わらない（クローラー/SNSシェア向けの初期HTMLだけが変わる）。
//
// なぜこうするか:
// - vercel.json は全ルートを /app.html（SPAのひな形）にrewriteする静的SPAのため、
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

// 投稿文の改行を段落/改行タグにする（エスケープ済みの文字列を返す）
function toParagraphs(str: string): string {
  return str
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

const VISIT_TIME_LABELS: Record<string, string> = {
  morning: '朝 / Morning',
  daytime: '昼 / Daytime',
  dusk: '夕方 / Dusk',
  night: '夜 / Night',
};

type ReviewBodyInput = {
  description: string;
  visitTime: string | null;
  imageUrls: string[];
  authorName: string | null;
  createdAt: string | null;
};

type SpotBodyInput = {
  title: string;
  place: string;
  description: string;
  access: string | null;
  visitTime: string | null;
  tags: string[];
  imageUrls: string[];
  authorName: string | null;
  createdAt: string | null;
  reviews: ReviewBodyInput[];
  nearby: NearbySpot[];
};

type NearbySpot = { slug: string; title: string; distanceKm: number };

// サーバー側HTMLに載せるレビューの上限（HTMLが肥大化しないように）
const MAX_REVIEWS_IN_HTML = 20;

// 「近くのリミナルスペース」の件数と、候補を探す範囲（緯度経度の±度数。1度 ≒ 約100km）
const MAX_NEARBY_SPOTS = 8;
const NEARBY_SEARCH_DEGREES = 1;

// 2点間の距離(km)。近い順に並べるための概算なので球面近似で十分
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

type NearbyRow = { id: string; slug: string; title: string | null; description: string | null; lat: number; lng: number };

function pickNearest(rows: NearbyRow[], lat: number, lng: number, excludeId: string): NearbySpot[] {
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r) => ({
      slug: r.slug,
      // リンク文字列の中で改行されないよう、空白・改行は1つの空白にまとめる
      title: ((r.title || '').trim() || (r.description || '').trim().slice(0, 40) || '無題の投稿').replace(/\s+/g, ' '),
      distanceKm: distanceKm(lat, lng, r.lat, r.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_NEARBY_SPOTS);
}

// 近くのスポットへの内部リンク。クローラーがスポット同士をたどれるようにする
function buildNearbySection(nearby: NearbySpot[]): string {
  const items = nearby
    .map((n) => {
      const km =
        n.distanceKm < 0.1 ? '&lt;0.1' : n.distanceKm < 10 ? n.distanceKm.toFixed(1) : Math.round(n.distanceKm).toString();
      return `<li><a href="/spot/${encodeURIComponent(n.slug)}">${escapeHtml(truncate(n.title, 60))}</a>（${km} km）</li>`;
    })
    .join('\n');
  return `<section>\n<h2>近くのリミナルスペース / Nearby spots</h2>\n<ul>\n${items}\n</ul>\n</section>`;
}

// アプリの「みんなの投稿」欄と同じ内容（新しい順）
function buildReviewsSection(title: string, reviews: ReviewBodyInput[]): string {
  const articles = reviews.map((r) => {
    const meta = [
      r.authorName ? escapeHtml(r.authorName) : null,
      r.createdAt ? `<time datetime="${escapeHtml(r.createdAt.slice(0, 10))}">${escapeHtml(r.createdAt.slice(0, 10))}</time>` : null,
      r.visitTime && VISIT_TIME_LABELS[r.visitTime] ? `訪問時間帯 / Best Time to Visit: ${VISIT_TIME_LABELS[r.visitTime]}` : null,
    ].filter(Boolean);
    const imgs = r.imageUrls.map(
      (url) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" />`
    );
    return [
      '<article>',
      meta.length ? `<p class="limap-ssr-meta">${meta.join(' ・ ')}</p>` : '',
      ...imgs,
      r.description.trim() ? toParagraphs(r.description) : '',
      '</article>',
    ]
      .filter(Boolean)
      .join('\n');
  });
  return `<section>\n<h2>みんなの投稿 / Posts from others (${reviews.length})</h2>\n${articles.join('\n')}\n</section>`;
}

// #root の中に入れる、スポットの本文HTML。
// JSを実行しないクローラー/SNSでも本文を読めるようにするためのもの。
// 通常のブラウザではロード画面(#limap-splash)が全面を覆っている間に
// React が createRoot で #root の中身を丸ごと置き換えるため、ユーザーの見た目は変わらない。
function buildSpotBody(s: SpotBodyInput): string {
  const parts: string[] = [];
  parts.push(`<h1>${escapeHtml(s.title)}</h1>`);
  if (s.place) parts.push(`<p class="limap-ssr-place">${escapeHtml(s.place)}</p>`);
  s.imageUrls.forEach((url, i) => {
    const alt = i === 0 ? s.title : `${s.title} (${i + 1})`;
    parts.push(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`);
  });
  if (s.description.trim()) parts.push(toParagraphs(s.description));

  const details: string[] = [];
  if (s.access?.trim()) {
    details.push(`<dt>アクセス / Access</dt><dd>${escapeHtml(s.access.trim()).replace(/\n/g, '<br />')}</dd>`);
  }
  if (s.visitTime && VISIT_TIME_LABELS[s.visitTime]) {
    details.push(`<dt>訪問時間帯 / Best Time to Visit</dt><dd>${VISIT_TIME_LABELS[s.visitTime]}</dd>`);
  }
  if (s.tags.length) {
    details.push(`<dt>タグ / Tags</dt><dd>${s.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</dd>`);
  }
  if (s.authorName) {
    details.push(`<dt>投稿者 / Posted by</dt><dd>${escapeHtml(s.authorName)}</dd>`);
  }
  if (s.createdAt) {
    const date = s.createdAt.slice(0, 10);
    details.push(`<dt>投稿日 / Posted on</dt><dd><time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time></dd>`);
  }
  if (details.length) parts.push(`<dl>${details.join('')}</dl>`);
  if (s.reviews.length) parts.push(buildReviewsSection(s.title, s.reviews));
  if (s.nearby.length) parts.push(buildNearbySection(s.nearby));

  parts.push(
    '<nav><a href="/">LIMapの地図でリミナルスペースを探す / Explore the map</a> ・ <a href="/articles/">コラム / Articles</a></nav>'
  );

  return `<main id="limap-ssr">\n${parts.join('\n')}\n</main>`;
}

type ReviewRow = {
  description: string | null;
  recommended_visit_time: string | null;
  created_at: string;
  images: { storage_path: string; thumbnail_path: string | null; position: number }[] | null;
  author: { username?: string; display_name?: string | null } | { username?: string; display_name?: string | null }[] | null;
};

// 新しい順に並べ、本文も写真も無いものは除く。
// 写真はアプリのレビュー欄と同じくサムネイルを使う（無ければ元画像）
function buildReviewInputs(rows: ReviewRow[], imageUrl: (path: string) => string): ReviewBodyInput[] {
  return [...rows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((r) => {
      const author = Array.isArray(r.author) ? r.author[0] : r.author;
      const images = [...(r.images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return {
        description: r.description || '',
        visitTime: r.recommended_visit_time,
        imageUrls: images.map((img) => imageUrl(img.thumbnail_path || img.storage_path)),
        authorName: author ? author.display_name || author.username || null : null,
        createdAt: r.created_at,
      };
    })
    .filter((r) => r.description.trim() || r.imageUrls.length)
    .slice(0, MAX_REVIEWS_IN_HTML);
}

export default async function handler(req: any, res: any) {
  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${proto}://${host}`;

  try {
    // index.html はトップページの本文入りのため、本文の無いひな形 app.html を使う（scripts/build-top-page.js）
    const baseHtmlRes = await fetch(`${origin}/app.html`);
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
        id, slug, title, description, lat, lng, country, city, status, created_at, updated_at,
        access, recommended_visit_time,
        images:spot_images(storage_path, position),
        tags:spot_tags(tag:tags(name)),
        author:profiles!spots_author_id_fkey(username, display_name),
        reviews:spot_reviews(
          description, recommended_visit_time, created_at,
          images:spot_review_images(storage_path, thumbnail_path, position),
          author:profiles!spot_reviews_author_id_fkey(username, display_name)
        )
      `
      )
      // URLの:idはLIMap ID(slug)。内部の主キー(id)とは別物。
      .eq('slug', id)
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

    const pageUrl = `https://limap.jp/spot/${spot.slug}`;
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
    // 投稿詳細画面はアプリ内背景が黄色のため、直接このURLを開いた/共有先から
    // 開いた場合も最初からブラウザのtheme-colorを黄色にしておく
    // (アプリ起動後はRootNavigator側で画面遷移に応じて切り替わる)
    html = replaceTag(
      html,
      /<meta name="theme-color" content="[^"]*"\s*\/>/,
      `<meta name="theme-color" content="#dece32" />`
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

    const tagRows = (spot.tags || []) as { tag: { name: string } | { name: string }[] | null }[];
    const tagNames = tagRows
      .map((row) => (Array.isArray(row.tag) ? row.tag[0]?.name : row.tag?.name))
      .filter((name): name is string => !!name);
    // 近くのスポット。取得に失敗しても本文の他の部分は出す
    let nearby: NearbySpot[] = [];
    if (typeof spot.lat === 'number' && typeof spot.lng === 'number') {
      const { data: nearbyRows } = await supabase
        .from('spots')
        .select('id, slug, title, description, lat, lng')
        .eq('status', 'published')
        .gte('lat', spot.lat - NEARBY_SEARCH_DEGREES)
        .lte('lat', spot.lat + NEARBY_SEARCH_DEGREES)
        .gte('lng', spot.lng - NEARBY_SEARCH_DEGREES)
        .lte('lng', spot.lng + NEARBY_SEARCH_DEGREES)
        .limit(200);
      nearby = pickNearest((nearbyRows || []) as NearbyRow[], spot.lat, spot.lng, spot.id);
    }

    const body = buildSpotBody({
      title: rawTitle,
      place,
      description: spot.description || '',
      access: spot.access,
      visitTime: spot.recommended_visit_time,
      tags: tagNames,
      imageUrls: sortedImages.map(
        (img) => supabase.storage.from('spot-images').getPublicUrl(img.storage_path).data.publicUrl
      ),
      authorName: author ? author.display_name || author.username || null : null,
      createdAt: spot.created_at,
      reviews: buildReviewInputs(
        (spot.reviews || []) as ReviewRow[],
        (path) => supabase.storage.from('spot-images').getPublicUrl(path).data.publicUrl
      ),
      nearby,
    });
    // 置換文字列中の $ が特殊扱いされないよう関数で渡す
    html = html.replace(/<div id="root"><\/div>/, () => `<div id="root">${body}</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
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
