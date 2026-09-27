// スポットの「種類・場所」の短いラベル（例:「地下通路・東京都」）。地図のカード・フィードで共通。
import { JAPAN_PREFECTURES } from '../content/japan';
import { COUNTRY_TAGS, spotPlace } from '../content/spotSeo';
import type { Spot } from '../types/database';

// 「種類」ではないタグ（場所を表すタグなど）。ラベルの種類部分から除く
const NON_CATEGORY_TAGS = new Set<string>(['リミナルスペース', '日本', '海外', ...JAPAN_PREFECTURES, ...COUNTRY_TAGS]);

export function spotKicker(spot: Pick<Spot, 'tags' | 'city' | 'country'>): string {
  const tagNames = (spot.tags ?? []).map((tag) => tag.name);
  const category = tagNames.find((name) => !NON_CATEGORY_TAGS.has(name));
  const place = spotPlace(tagNames, spot.city, spot.country).label;
  return [category, place].filter(Boolean).join('・');
}
