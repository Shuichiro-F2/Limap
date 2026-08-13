import { Platform } from 'react-native';
import { spotImageUrl } from './spots';
import type { Spot } from '../types/database';

// public/index.html の静的な値と揃えておく（Webでスポット詳細から離脱した際に戻す用）
const DEFAULT_TITLE = 'LIMap（リマップ） | 限界空間を記録・共有する地図アプリ';
const DEFAULT_DESCRIPTION =
  'LIMapは、廃墟や無人駅、深夜の駐車場など「限界空間（リミナルスペース）」を写真と場所で記録・共有できる地図アプリです。街や旅先に潜む不思議な空間を、みんなで見つけて地図に残しましょう。';
const DEFAULT_OG_IMAGE = 'https://limap.jp/og-image.png';
const SITE_NAME = 'LIMap（リマップ）';
const JSONLD_ID = 'limap-spot-jsonld';

function setMetaContent(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

// SPA内の画面遷移（クライアントサイドルーティング）で /spot/:id を開いた場合、
// サーバー側(api/spot.ts)のHTML注入は最初の1回のHTTPリクエストにしか効かないため、
// JSを実行するクローラーやアプリ内遷移でも正しいタイトル・OGP・構造化データになるよう
// ここで document 側のタグを直接書き換える。
export function applySpotSeo(spot: Spot) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const place = [spot.city, spot.country].filter(Boolean).join(', ');
  const rawTitle = (spot.title || '').trim() || (spot.description || '').trim().slice(0, 40) || '無題の投稿';
  const pageTitle = `${truncate(rawTitle, 40)} | ${SITE_NAME}`;
  const descBase =
    (spot.description || '').trim() ||
    '限界空間（リミナルスペース）を記録した投稿です。写真と場所の詳細はLIMapでご覧いただけます。';
  const pageDescription = truncate(place ? `${place}にある限界空間の記録。${descBase}` : descBase, 120);

  const firstImage = (spot.images || []).slice().sort((a, b) => a.position - b.position)[0];
  const ogImage = firstImage ? spotImageUrl(firstImage.storage_path) : DEFAULT_OG_IMAGE;
  const pageUrl = `https://limap.jp/spot/${spot.id}`;

  document.title = pageTitle;
  setMetaContent('meta[name="description"]', pageDescription);
  setMetaContent('meta[property="og:url"]', pageUrl);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', pageDescription);
  setMetaContent('meta[property="og:image"]', ogImage);
  setMetaContent('meta[name="twitter:title"]', pageTitle);
  setMetaContent('meta[name="twitter:description"]', pageDescription);
  setMetaContent('meta[name="twitter:image"]', ogImage);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', pageUrl);

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
    dateCreated: spot.created_at,
    dateModified: spot.updated_at,
    ...(spot.author?.username
      ? { author: { '@type': 'Person', name: spot.author.display_name || spot.author.username } }
      : {}),
  };

  let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = JSONLD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

// スポット詳細画面を離れる際、タブのタイトルやOGPをアプリ全体の既定値に戻す
export function resetSeo() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  document.title = DEFAULT_TITLE;
  setMetaContent('meta[name="description"]', DEFAULT_DESCRIPTION);
  setMetaContent('meta[property="og:url"]', 'https://limap.jp/');
  setMetaContent('meta[property="og:title"]', DEFAULT_TITLE);
  setMetaContent('meta[property="og:description"]', DEFAULT_DESCRIPTION);
  setMetaContent('meta[property="og:image"]', DEFAULT_OG_IMAGE);
  setMetaContent('meta[name="twitter:title"]', DEFAULT_TITLE);
  setMetaContent('meta[name="twitter:description"]', DEFAULT_DESCRIPTION);
  setMetaContent('meta[name="twitter:image"]', DEFAULT_OG_IMAGE);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', 'https://limap.jp/');

  const script = document.getElementById(JSONLD_ID);
  if (script) script.remove();
}
