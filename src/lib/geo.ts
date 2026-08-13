import type { Spot } from '../types/database';

// 地図上のクラスタリング表示のため、投稿一覧をGeoJSONのFeatureCollectionに変換する。
// ネイティブ版(@rnmapbox/maps)・Web版(react-map-gl/mapbox-gl-js)共通で使う。
export function spotsToFeatureCollection(
  spots: Spot[]
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; slug: string }> {
  return {
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature',
      id: spot.id,
      geometry: { type: 'Point', coordinates: [spot.lng, spot.lat] },
      // idは内部の主キー、slugはURL/画面遷移で使うLIMap ID
      properties: { id: spot.id, slug: spot.slug },
    })),
  };
}
