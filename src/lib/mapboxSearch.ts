import { MAPBOX_ACCESS_TOKEN } from '@env';

// Mapbox Search Box API 用のセッショントークン（課金単位を「検索セッション」でまとめるために必要）
export function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SuggestResult {
  mapboxId: string;
  name: string;
  placeFormatted: string;
}

// 施設名などのフリーワード検索には、住所向けのGeocoding APIではなく
// POI検索に強いSearch Box APIを使う（suggest→retrieveの2段階呼び出し）
export async function suggestPlaces(
  query: string,
  sessionToken: string,
  proximity: { lat: number; lng: number }
): Promise<SuggestResult[]> {
  const url =
    `https://api.mapbox.com/search/searchbox/v1/suggest` +
    `?q=${encodeURIComponent(query)}` +
    `&access_token=${MAPBOX_ACCESS_TOKEN}` +
    `&session_token=${sessionToken}` +
    `&language=ja&limit=8` +
    `&types=poi,address,place,neighborhood,locality,street` +
    `&proximity=${proximity.lng},${proximity.lat}`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.suggestions ?? []).map((s: any) => ({
    mapboxId: s.mapbox_id,
    name: s.name,
    placeFormatted: s.place_formatted ?? s.full_address ?? '',
  }));
}

export async function retrievePlace(
  mapboxId: string,
  sessionToken: string
): Promise<{ lat: number; lng: number } | null> {
  const url =
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}` +
    `?access_token=${MAPBOX_ACCESS_TOKEN}&session_token=${sessionToken}`;
  const res = await fetch(url);
  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
}
