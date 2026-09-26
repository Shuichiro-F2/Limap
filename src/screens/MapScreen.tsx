import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Keyboard, Platform, Linking } from 'react-native';
import Mapbox, { Camera, MapView, UserLocation, ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
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

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// リミナルスペースらしい、彩度を落とした暗めのマップスタイル
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

// 近接する投稿をまとめて円＋件数で表示するクラスタリング設定（Web版と同じ見た目）。
// クラスタは暗い円に黄色の縁と数字、個別のスポットは黄色の点に暗い縁取り。
const clusterCircleStyle = {
  circleColor: colors.surface,
  circleRadius: ['step', ['get', 'point_count'], 16, 10, 20, 30, 26] as any,
  circleStrokeWidth: 2,
  circleStrokeColor: colors.accent,
};
const clusterCountStyle = {
  textField: ['get', 'point_count_abbreviated'] as any,
  textSize: 13,
  textColor: colors.accent,
  textAllowOverlap: true,
  textIgnorePlacement: true,
};
const pointStyle = {
  circleColor: colors.accent,
  circleRadius: 7,
  circleStrokeWidth: 3,
  circleStrokeColor: colors.background,
};
// 選択中のスポットは、大きめの点に黄色の外輪を付けて目立たせる
const selectedStyle = {
  circleColor: colors.accent,
  circleRadius: 11,
  circleStrokeWidth: 4,
  circleStrokeColor: colors.background,
};
const selectedRingStyle = {
  circleColor: 'rgba(0,0,0,0)',
  circleRadius: 17,
  circleStrokeWidth: 2,
  circleStrokeColor: colors.accent,
};

// ShapeSource#onPress のイベント型（@rnmapbox/maps はルートからexportしていないため独自定義）
type SpotsSourcePressEvent = {
  features: GeoJSON.Feature[];
  coordinates: { latitude: number; longitude: number };
  point: { x: number; y: number };
};

type Props = MainTabScreenProps<'MapTab'>;

export default function MapScreen({ navigation, route }: Props) {
  const { session, blockedUserIds } = useAuth();
  const t = useTranslation();
  const { language } = useLanguage();
  const [spots, setSpots] = useState<Spot[]>([]);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const shapeSourceRef = useRef<ShapeSource>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastCenter, setLastCenter] = useState({ lat: 35.681, lng: 139.767 });
  const sessionTokenRef = useRef(generateSessionToken());
  const [locationGranted, setLocationGranted] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [cardHeight, setCardHeight] = useState(114);

  // 選んだ種類のタグが付いたスポットだけを地図に出す
  const visibleSpots = useMemo(
    () => spots.filter((spot) => spotMatchesFilter((spot.tags ?? []).map((tag) => tag.name), filter)),
    [spots, filter]
  );
  const featureCollection = useMemo(() => spotsToFeatureCollection(visibleSpots), [visibleSpots]);
  const selectedFilter = ['all', ['!', ['has', 'point_count']], ['==', ['get', 'slug'], selectedSpot?.slug ?? '']] as any;

  // 現在地マーカー表示のための許可確認と、起動時に現在地を中心にするための初期カメラ移動
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      setLocationGranted(status === 'granted');
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        cameraRef.current?.setCamera({
          centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
          zoomLevel: 13,
          animationDuration: 0,
        });
      } catch (e) {
        console.warn('現在地取得エラー', e);
      }
    });
  }, []);

  // 検索・マイページなど地図以外の画面から「地図で見る」で渡された座標に飛ぶ
  useEffect(() => {
    const focusLat = route.params?.focusLat;
    const focusLng = route.params?.focusLng;
    if (focusLat == null || focusLng == null) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [focusLng, focusLat],
      zoomLevel: 15,
      animationDuration: 500,
    });
    navigation.setParams({ focusLat: undefined, focusLng: undefined });
  }, [route.params?.focusLat, route.params?.focusLng, navigation]);

  const loadForBounds = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      const bounds = await mapRef.current.getVisibleBounds();
      // getVisibleBounds -> [[neLng, neLat], [swLng, swLat]]
      const [[maxLng, maxLat], [minLng, minLat]] = bounds;
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
    cameraRef.current?.setCamera({
      centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
      zoomLevel: 12,
      animationDuration: 600,
    });
  };

  // Appleの審査ガイドライン4(位置情報機能はネイティブのApple Mapsアプリを起動できる
  // 選択肢を用意する必要がある)への対応。地図画面そのものはMapbox製のため、今見ている
  // 範囲の中心座標でApple Mapsアプリを直接開けるボタンを、地図のメイン画面上に用意する
  // (投稿詳細画面の個別リンクだけでは不十分と判断されたため、より見つけやすいこちらにも追加)。
  const openInAppleMaps = () => {
    const url = `https://maps.apple.com/?ll=${lastCenter.lat},${lastCenter.lng}`;
    Linking.openURL(url).catch(() => {});
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
      cameraRef.current?.setCamera({
        centerCoordinate: [place.lng, place.lat],
        zoomLevel: 15,
        animationDuration: 600,
      });
    } catch (e) {
      console.warn('詳細取得エラー', e);
    } finally {
      sessionTokenRef.current = generateSessionToken();
    }
  };

  // クラスタ（複数投稿の集合）をタップしたら拡大、個別ポイントをタップしたら下にカードを出す
  const onSpotsPress = useCallback(async (event: SpotsSourcePressEvent) => {
    const feature = event.features[0];
    if (!feature) return;
    const props = (feature.properties ?? {}) as { cluster?: boolean; id?: string; slug?: string };
    if (props.cluster) {
      try {
        const zoom = await shapeSourceRef.current?.getClusterExpansionZoom(feature);
        cameraRef.current?.setCamera({
          centerCoordinate: [event.coordinates.longitude, event.coordinates.latitude],
          zoomLevel: (zoom ?? 14) + 0.5,
          animationDuration: 400,
        });
      } catch (e) {
        console.warn('クラスタ展開エラー', e);
      }
      return;
    }
    if (props.slug) setSelectedSpot(spots.find((spot) => spot.slug === props.slug) ?? null);
  }, [spots]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MAP_STYLE}
        // 地図上の地名をアプリの表示言語に合わせる
        localizeLabels={{ locale: language }}
        onMapIdle={loadForBounds}
        onDidFinishLoadingMap={loadForBounds}
        scaleBarPosition={{ bottom: 46, left: 8 }}
      >
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: [139.767, 35.681], zoomLevel: 13 }} />
        {locationGranted && <UserLocation visible androidRenderMode="normal" showsUserHeadingIndicator />}
        <ShapeSource
          ref={shapeSourceRef}
          id="spots-source"
          shape={featureCollection}
          cluster
          clusterRadius={50}
          clusterMaxZoomLevel={14}
          onPress={onSpotsPress}
        >
          <CircleLayer id="clusters" filter={['has', 'point_count']} style={clusterCircleStyle} />
          <SymbolLayer id="cluster-count" filter={['has', 'point_count']} style={clusterCountStyle} />
          <CircleLayer id="unclustered-point" filter={['!', ['has', 'point_count']]} style={pointStyle} />
          <CircleLayer id="selected-point-ring" filter={selectedFilter} style={selectedRingStyle} />
          <CircleLayer id="selected-point" filter={selectedFilter} style={selectedStyle} />
        </ShapeSource>
      </MapView>

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
        {/* iOSのみ: ネイティブのApple Mapsアプリを、今表示している地図の中心座標で開く */}
        {Platform.OS === 'ios' && (
          <Pressable style={styles.roundButton} onPress={openInAppleMaps} hitSlop={8}>
            <Ionicons name="map-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        )}
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
  map: { flex: 1 },
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
  cardWrap: { position: 'absolute', left: space.m, right: space.m, bottom: space.m },
});
