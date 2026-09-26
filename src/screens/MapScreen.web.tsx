// Web版の地図画面。
// @rnmapbox/maps はネイティブ専用のためWebでは使えず、代わりに mapbox-gl-js を
// react-map-gl 経由で使う。UI・機能はネイティブ版(MapScreen.tsx)と揃えている。
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Keyboard } from 'react-native';
import Map, { Marker, ScaleControl, Source, Layer, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { fetchSpotsInBounds } from '../lib/spots';
import { filterBlockedAuthors } from '../lib/moderation';
import { spotsToFeatureCollection } from '../lib/geo';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import MapTopBar, { spotMatchesFilter } from '../components/MapTopBar';
import MapSpotCard from '../components/MapSpotCard';
import { useAuth } from '../lib/AuthContext';
import { useLanguage, useTranslation } from '../lib/i18n';
import { colors, radius, space } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

// リミナルスペースらしい、彩度を落とした暗めのマップスタイル（ネイティブ版と同じ）
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

const SPOTS_SOURCE_ID = 'spots-source';
const CLUSTER_LAYER_ID = 'clusters';
const CLUSTER_COUNT_LAYER_ID = 'cluster-count';
const UNCLUSTERED_LAYER_ID = 'unclustered-point';
const SELECTED_LAYER_ID = 'selected-point';

// 近接する投稿をまとめて円＋件数で表示するクラスタリング設定（ネイティブ版と同じ見た目）。
// クラスタは暗い円に黄色の縁と数字、個別のスポットは黄色の点に暗い縁取り。
// mapbox-gl-js のスタイル式の型がやや厳密なため、ここでは any で受ける。
const clusterLayerPaint: any = {
  'circle-color': colors.surface,
  'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26],
  'circle-stroke-width': 2,
  'circle-stroke-color': colors.accent,
};
const clusterCountLayout: any = {
  'text-field': ['get', 'point_count_abbreviated'],
  'text-size': 13,
};
const unclusteredPaint: any = {
  'circle-color': colors.accent,
  'circle-radius': 7,
  'circle-stroke-width': 3,
  'circle-stroke-color': colors.background,
};
// 選択中のスポットは、大きめの点に黄色の外輪を付けて目立たせる
const selectedPaint: any = {
  'circle-color': colors.accent,
  'circle-radius': 11,
  'circle-stroke-width': 4,
  'circle-stroke-color': colors.background,
};
const selectedRingPaint: any = {
  'circle-color': 'rgba(0,0,0,0)',
  'circle-radius': 17,
  'circle-stroke-width': 2,
  'circle-stroke-color': colors.accent,
};

type Props = MainTabScreenProps<'MapTab'>;

export default function MapScreen({ navigation, route }: Props) {
  const { session, blockedUserIds } = useAuth();
  const t = useTranslation();
  const { language } = useLanguage();
  const [spots, setSpots] = useState<Spot[]>([]);
  const mapRef = useRef<MapRef>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastCenter, setLastCenter] = useState({ lat: 35.681, lng: 139.767 });
  const sessionTokenRef = useRef(generateSessionToken());
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [cardHeight, setCardHeight] = useState(114);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 現在地の許可確認と、起動時に現在地を中心にするための初期カメラ移動
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        mapRef.current?.jumpTo({ center: [loc.coords.longitude, loc.coords.latitude], zoom: 13 });
      } catch (e) {
        console.warn('現在地取得エラー', e);
      }
    });
  }, []);

  // 地図上の地名をアプリの表示言語に合わせる（初期表示は Map の language で、切り替え後はここで反映）
  useEffect(() => {
    const map = mapRef.current?.getMap() as unknown as { setLanguage?: (lang: string) => void } | undefined;
    map?.setLanguage?.(language);
  }, [language]);

  // 選んだ種類のタグが付いたスポットだけを地図に出す
  const visibleSpots = useMemo(
    () => spots.filter((spot) => spotMatchesFilter((spot.tags ?? []).map((tag) => tag.name), filter)),
    [spots, filter]
  );
  const featureCollection = useMemo(() => spotsToFeatureCollection(visibleSpots), [visibleSpots]);

  // 検索・マイページなど地図以外の画面から「地図で見る」で渡された座標に飛ぶ
  useEffect(() => {
    const focusLat = route.params?.focusLat;
    const focusLng = route.params?.focusLng;
    if (focusLat == null || focusLng == null) return;
    mapRef.current?.flyTo({ center: [focusLng, focusLat], zoom: 15, duration: 500 });
    navigation.setParams({ focusLat: undefined, focusLng: undefined });
  }, [route.params?.focusLat, route.params?.focusLng, navigation]);

  const loadForBounds = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      const minLat = bounds.getSouth();
      const maxLat = bounds.getNorth();
      const minLng = bounds.getWest();
      const maxLng = bounds.getEast();
      setLastCenter({ lat: (maxLat + minLat) / 2, lng: (maxLng + minLng) / 2 });
      const data = await fetchSpotsInBounds({ minLat, maxLat, minLng, maxLng });
      setSpots(filterBlockedAuthors(data, blockedUserIds));
    } catch (e) {
      console.warn('スポット取得エラー', e);
    }
  }, [blockedUserIds]);

  const goToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    mapRef.current?.flyTo({ center: [loc.coords.longitude, loc.coords.latitude], zoom: 12, duration: 600 });
  };

  const search = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      const items = await suggestPlaces(query, sessionTokenRef.current, lastCenter);
      setResults(items);
    } catch (e) {
      console.warn('検索エラー', e);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = async (item: SuggestResult) => {
    setResults([]);
    setQuery(item.name);
    try {
      const place = await retrievePlace(item.mapboxId, sessionTokenRef.current);
      if (!place) return;
      mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: 15, duration: 600 });
    } catch (e) {
      console.warn('詳細取得エラー', e);
    } finally {
      sessionTokenRef.current = generateSessionToken();
    }
  };

  // クラスタ（複数投稿の集合）をクリックしたら拡大、個別ポイントをクリックしたら下にカードを出す。
  // 何もない所をクリックしたらカードを閉じる
  const onSpotsClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedSpot(null);
      return;
    }
    const props = (feature.properties ?? {}) as {
      cluster?: boolean;
      cluster_id?: number;
      id?: string;
      slug?: string;
    };

    if (props.cluster && props.cluster_id != null) {
      const map = mapRef.current?.getMap();
      const source = map?.getSource(SPOTS_SOURCE_ID) as
        | { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number) => void) => void }
        | undefined;
      if (!source) return;
      source.getClusterExpansionZoom(props.cluster_id, (err, zoom) => {
        if (err) return;
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 400 });
      });
      return;
    }

    if (props.slug) setSelectedSpot(spots.find((spot) => spot.slug === props.slug) ?? null);
  }, [spots]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={MAP_STYLE}
          language={language}
          initialViewState={{ latitude: 35.681, longitude: 139.767, zoom: 13 }}
          style={{ width: '100%', height: '100%' }}
          onLoad={loadForBounds}
          onMoveEnd={loadForBounds}
          interactiveLayerIds={[CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID]}
          onClick={onSpotsClick}
        >
          <ScaleControl position="bottom-left" unit="metric" />

          {userLocation && (
            <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
              <View style={styles.userDotOuter}>
                <View style={styles.userDotInner} />
              </View>
            </Marker>
          )}

          <Source
            id={SPOTS_SOURCE_ID}
            type="geojson"
            data={featureCollection}
            cluster
            clusterRadius={50}
            clusterMaxZoom={14}
          >
            <Layer id={CLUSTER_LAYER_ID} type="circle" filter={['has', 'point_count']} paint={clusterLayerPaint} />
            <Layer
              id={CLUSTER_COUNT_LAYER_ID}
              type="symbol"
              filter={['has', 'point_count']}
              layout={clusterCountLayout}
              paint={{ 'text-color': colors.accent }}
            />
            <Layer
              id={UNCLUSTERED_LAYER_ID}
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={unclusteredPaint}
            />
            <Layer
              id={`${SELECTED_LAYER_ID}-ring`}
              type="circle"
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'slug'], selectedSpot?.slug ?? '']]}
              paint={selectedRingPaint}
            />
            <Layer
              id={SELECTED_LAYER_ID}
              type="circle"
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'slug'], selectedSpot?.slug ?? '']]}
              paint={selectedPaint}
            />
          </Source>
        </Map>
      </View>

      <MapTopBar
        query={query}
        onChangeQuery={setQuery}
        onSubmit={search}
        onClear={() => {
          setQuery('');
          setResults([]);
        }}
        searching={searching}
        results={results}
        onSelectResult={selectResult}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* 右下のボタン列。スポットのカードを出している間は、その上に逃がす */}
      <View style={[styles.sideButtons, { bottom: selectedSpot ? cardHeight + space.m * 2 : space.xl }]} pointerEvents="box-none">
        <Pressable
          style={styles.roundButton}
          onPress={goToMyLocation}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.map.locate}
        >
          <Ionicons name="locate-outline" size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate(session?.user ? 'CreateSpot' : 'Auth')}
          accessibilityRole="button"
          accessibilityLabel={t.map.post}
        >
          <Ionicons name="add" size={28} color={colors.accentText} />
        </Pressable>
      </View>

      {selectedSpot && (
        <View style={styles.cardWrap} onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
          <MapSpotCard
            spot={selectedSpot}
            onPress={() => navigation.navigate('SpotDetail', { spotId: selectedSpot.slug })}
            onClose={() => setSelectedSpot(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1 },
  userDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(51,153,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3399ff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sideButtons: { position: 'absolute', right: space.l, alignItems: 'center', gap: space.m },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  // 横長の画面(PC)でカードが間延びしないよう、幅に上限を付けて左下に寄せる
  cardWrap: { position: 'absolute', left: space.m, right: space.m, bottom: space.m, maxWidth: 480 },
});
