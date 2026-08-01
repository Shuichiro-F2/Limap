// Web版の地図画面。
// @rnmapbox/maps はネイティブ専用のためWebでは使えず、代わりに mapbox-gl-js を
// react-map-gl 経由で使う。UI・機能はネイティブ版(MapScreen.tsx)と揃えている。
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  TextInput,
  FlatList,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Map, { Marker, ScaleControl, Source, Layer, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { fetchSpotsInBounds } from '../lib/spots';
import { spotsToFeatureCollection } from '../lib/geo';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import SpotPreviewSheet from '../components/SpotPreviewSheet';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

// リミナルスペースらしい、彩度を落とした暗めのマップスタイル（ネイティブ版と同じ）
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

const SPOTS_SOURCE_ID = 'spots-source';
const CLUSTER_LAYER_ID = 'clusters';
const CLUSTER_COUNT_LAYER_ID = 'cluster-count';
const UNCLUSTERED_LAYER_ID = 'unclustered-point';

// 近接する投稿をまとめて円＋件数で表示するクラスタリング設定（ネイティブ版と同じ見た目）
// mapbox-gl-js のスタイル式の型がやや厳密なため、ここでは any で受ける。
const clusterLayerPaint: any = {
  'circle-color': colors.accent,
  'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26],
  'circle-opacity': 0.92,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#fff',
};
const clusterCountLayout: any = {
  'text-field': ['get', 'point_count_abbreviated'],
  'text-size': 13,
};
const unclusteredPaint: any = {
  'circle-color': colors.accent,
  'circle-radius': 7,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#fff',
};

type Props = MainTabScreenProps<'MapTab'>;

export default function MapScreen({ navigation, route }: Props) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const mapRef = useRef<MapRef>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastCenter, setLastCenter] = useState({ lat: 35.681, lng: 139.767 });
  const sessionTokenRef = useRef(generateSessionToken());
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
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
      setSpots(data);
    } catch (e) {
      console.warn('スポット取得エラー', e);
    }
  }, []);

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

  // クラスタ（複数投稿の集合）をクリックしたら拡大、個別ポイントをクリックしたら詳細シートを開く
  const onSpotsClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const props = (feature.properties ?? {}) as {
      cluster?: boolean;
      cluster_id?: number;
      id?: string;
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

    if (props.id) setSelectedSpotId(props.id);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={MAP_STYLE}
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
            data={spotsToFeatureCollection(spots)}
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
              paint={{ 'text-color': '#2a2a2a' }}
            />
            <Layer
              id={UNCLUSTERED_LAYER_ID}
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={unclusteredPaint}
            />
          </Source>
        </Map>
      </View>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.logoRow} pointerEvents="none">
          <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="住所や施設名で検索"
            placeholderTextColor="#666"
            onSubmitEditing={search}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={search}>
            {searching ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Text style={styles.searchButtonText}>検索</Text>
            )}
          </Pressable>
        </View>

        {results.length > 0 && (
          <FlatList
            style={styles.resultList}
            data={results}
            keyExtractor={(item) => item.mapboxId}
            renderItem={({ item }) => (
              <Pressable style={styles.resultItem} onPress={() => selectResult(item)}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                {!!item.placeFormatted && (
                  <Text style={styles.resultText} numberOfLines={1}>
                    {item.placeFormatted}
                  </Text>
                )}
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      <Pressable style={styles.locateButton} onPress={goToMyLocation}>
        <Text style={styles.locateButtonText}>現在地</Text>
      </Pressable>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateSpot')}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      <SpotPreviewSheet
        spotId={selectedSpotId}
        onClose={() => setSelectedSpotId(null)}
        onViewOnMap={(lat, lng) => {
          setSelectedSpotId(null);
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 500 });
        }}
      />
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
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  logoRow: { paddingLeft: 20, paddingTop: 4 },
  logo: { width: 84, height: 52 },
  searchBar: { flexDirection: 'row', padding: 12, gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(61,61,61,0.95)',
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: colors.accentText, fontSize: 14, fontWeight: '600' },
  resultList: {
    maxHeight: 260,
    backgroundColor: 'rgba(58,58,58,0.97)',
    marginHorizontal: 12,
    borderRadius: 10,
  },
  resultItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  resultText: { color: colors.textSecondary, fontSize: 12 },
  locateButton: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    backgroundColor: 'rgba(61,61,61,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  locateButtonText: { color: colors.textPrimary, fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: colors.accentText, fontSize: 28, marginTop: -2 },
});
