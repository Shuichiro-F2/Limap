// Vercel Serverless Function
// 公式スポットの英語のページ。vercel.json の rewrites で /en/spot/<LIMap ID> → /api/spot-en?id=<LIMap ID>
//
// 日本語のスポットのページ（api/spot.ts、/spot/<ID>）はアプリ（SPA）のひな形に本文を入れて返すが、
// こちらは英語で検索する人向けに、アプリを読み込まない独立したページにする（タグ別ページと同じ作り）。
// 英語の名前（spots.title_en）と英語の説明文（spots.description_en）がある公式スポットだけを出し、無ければ 404。
// 写真や SNS の投稿は日本語のページ（アプリ）で見られるので、そこへリンクする。

import { createClient } from '@supabase/supabase-js';
import { SITE_URL, breadcrumbJsonLd, escapeHtml, renderPage } from '../src/content/ssrPage';
import { placeLabelEn } from '../src/content/placeNamesEn';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const NEARBY_LIMIT = 6;
// 近くのスポットを探す範囲（緯度経度の±度数。1度 ≒ 約100km）
const NEARBY_RANGE_DEG = 1.5;

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function notFound(res: any) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send(
    renderPage({
      title: 'Spot not found | LIMap',
      description: 'This page is not available in English.',
      url: `${SITE_URL}/`,
      jsonLd: [],
      body: '<h1 class="article-title">Spot not found</h1><p><a href="/">Explore the LIMap map</a></p>',
      noindex: true,
      lang: 'en',
    })
  );
}

export default async function handler(req: any, res: any) {
  const idParam = req.query?.id;
  const id: string | undefined = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id || !/^[A-Za-z0-9]{6,16}$/.test(id) || !SUPABASE_URL || !SUPABASE_ANON_KEY) return notFound(res);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: spot, error } = await supabase
    .from('spots')
    .select('id, slug, title_en, description_en, lat, lng, updated_at, tags:spot_tags(tag:tags(name))')
    .eq('slug', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !spot || !(spot as any).title_en || !(spot as any).description_en) return notFound(res);

  const s = spot as any;
  const tagNames: string[] = (s.tags || []).map((r: any) => (Array.isArray(r.tag) ? r.tag[0] : r.tag)?.name).filter(Boolean);
  const place = placeLabelEn(tagNames);
  const title: string = s.title_en;
  const url = `${SITE_URL}/en/spot/${s.slug}`;
  const jaUrl = `${SITE_URL}/spot/${s.slug}`;
  const pageTitle = `${title}${place ? ` (${place})` : ''} | LIMap`;
  const firstSentence = s.description_en.trim().split(/(?<=\.)\s/)[0];
  const description = `${firstSentence} A liminal space on LIMap, the map of eerie, empty, nostalgic places.`.slice(0, 300);

  // 近くの英語のページがあるスポット（英語のページどうしをつなぐ）
  const { data: nearbyRows } = await supabase
    .from('spots')
    .select('slug, title_en, lat, lng')
    .eq('status', 'published')
    .not('title_en', 'is', null)
    .not('description_en', 'is', null)
    .neq('id', s.id)
    .gte('lat', s.lat - NEARBY_RANGE_DEG)
    .lte('lat', s.lat + NEARBY_RANGE_DEG)
    .gte('lng', s.lng - NEARBY_RANGE_DEG)
    .lte('lng', s.lng + NEARBY_RANGE_DEG)
    .limit(60);
  const nearby = ((nearbyRows ?? []) as any[])
    .map((n) => ({ ...n, km: distanceKm(s.lat, s.lng, n.lat, n.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, NEARBY_LIMIT);

  const crumbs = [
    { name: 'LIMap', url: `${SITE_URL}/` },
    { name: title, url },
  ];
  const nearbyBlock = nearby.length
    ? `      <h2 class="section-heading">Nearby liminal spaces</h2>
      <ul>
${nearby
  .map(
    (n) =>
      `        <li><a href="/en/spot/${encodeURIComponent(n.slug)}">${escapeHtml(n.title_en)}</a> (${
        n.km < 10 ? n.km.toFixed(1) : Math.round(n.km)
      } km)</li>`
  )
  .join('\n')}
      </ul>\n`
    : '';

  const body = `      <nav aria-label="Breadcrumb" class="breadcrumb"><a href="/">LIMap</a> › <span aria-current="page">${escapeHtml(title)}</span></nav>
      <span class="article-category">Liminal space${place ? ` · ${escapeHtml(place)}` : ''}</span>
      <h1 class="article-title">${escapeHtml(title)}</h1>
${paragraphs(s.description_en)}
      <p class="tag-cta"><a href="${jaUrl}">See photos and posts for this place on the LIMap map</a></p>
${nearbyBlock}      <p class="tag-note">LIMap is a map for finding and sharing liminal spaces: places emptied of people that feel eerie and nostalgic at the same time. Many of these places are private or off-limits, so please follow the notes above and view them only from where you are allowed.</p>
      <p><a href="${SITE_URL}/en/articles/what-is-liminal-space/">What is a liminal space?</a></p>`;

  const html = renderPage({
    title: pageTitle,
    description,
    url,
    lang: 'en',
    image: `${SITE_URL}/api/og?id=${encodeURIComponent(s.slug)}&lang=en`,
    alternates: [
      { hreflang: 'ja', href: jaUrl },
      { hreflang: 'en', href: url },
      { hreflang: 'x-default', href: jaUrl },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: title,
        description: s.description_en,
        url,
        geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng },
        ...(place ? { address: { '@type': 'PostalAddress', addressCountry: place.split(', ').pop() } } : {}),
      },
      breadcrumbJsonLd(crumbs),
    ],
    body,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
