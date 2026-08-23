import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Mapbox, { Camera, MapView, UserLocation, ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { fetchSpotsInBounds } from '../lib/spots';
import { spotsToFeatureCollection } from '../lib/geo';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import SpotPreviewSheet from '../components/SpotPreviewSheet';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// リミナルスペースらしい、彩度を落とした暗めのマップスタイル
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

// 近接する投稿をまとめて円＋件数で表示するクラスタリング設定
const clusterCircleStyle = {
  circleColor: colors.accent,
  circleRadius: ['step', ['get', 'point_count'], 16, 10, 20, 30, 26] as any,
  circleOpacity: 0.92,
  circleStrokeWidth: 2,
  circleStrokeColor: '#fff',
};
const clusterCountStyle = {
  textField: ['get', 'point_count_abbreviated'] as any,
  textSize: 13,
  textColor: '#2a2a2a',
  textAllowOverlap: true,
  textIgnorePlacement: true,
};
const pointStyle = {
  circleColor: colors.accent,
  circleRadius: 7,
  circleStrokeWidth: 2,
  circleStrokeColor: '#fff',
};

// ShapeSource#onPress のイベント型（@rnmapbox/maps はルートからexportしていないため独自定義）
type SpotsSourcePressEvent = {
  features: GeoJSON.Feature[];
  coordinates: { latitude: number; longitude: number };
  point: { x: number; y: number };
};

type Props = MainTabScreenProps<'MapTab'>;

export default function MapScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const t = useTranslation();
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
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

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
      setSpots(data);
    } catch (e) {
      console.warn('スポット取得エラー', e);
    }
  }, []);

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

  // クラスタ（複数投稿の集合）をタップしたら拡大、個別ポイントをタップしたら詳細シートを開く
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
    if (props.slug) setSelectedSpotId(props.slug);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MAP_STYLE}
        onMapIdle={loadForBounds}
        onDidFinishLoadingMap={loadForBounds}
        scaleBarPosition={{ bottom: 46, left: 8 }}
      >
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: [139.767, 35.681], zoomLevel: 13 }} />
        {locationGranted && <UserLocation visible androidRenderMode="normal" showsUserHeadingIndicator />}
        <ShapeSource
          ref={shapeSourceRef}
          id="spots-source"
          shape={spotsToFeatureCollection(spots)}
          cluster
          clusterRadius={50}
          clusterMaxZoomLevel={14}
          onPress={onSpotsPress}
        >
          <CircleLayer id="clusters" filter={['has', 'point_count']} style={clusterCircleStyle} />
          <SymbolLayer id="cluster-count" filter={['has', 'point_count']} style={clusterCountStyle} />
          <CircleLayer id="unclustered-point" filter={['!', ['has', 'point_count']]} style={pointStyle} />
        </ShapeSource>
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        {/* 共通ヘッダー(ロゴ+言語トグル)が最前面に重なっているため、その高さ分だけ空けてから検索バーを配置する */}
        <View style={{ height: HEADER_CONTENT_HEIGHT }} pointerEvents="none" />

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t.map.searchPlaceholder}
            placeholderTextColor="#666"
            onSubmitEditing={search}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={search} hitSlop={8}>
            {searching ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Ionicons name="search-outline" size={18} color={colors.accentText} />
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

      <Pressable style={styles.locateButton} onPress={goToMyLocation} hitSlop={8}>
        <Ionicons name="locate-outline" size={20} color={colors.textPrimary} />
      </Pressable>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate(session?.user ? 'CreateSpot' : 'Auth')}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      <SpotPreviewSheet
        spotId={selectedSpotId}
        onClose={() => setSelectedSpotId(null)}
        onViewOnMap={(lat, lng) => {
          setSelectedSpotId(null);
          cameraRef.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 15,
            animationDuration: 500,
          });
        }}
        onTagPress={(tagId) => {
          setSelectedSpotId(null);
          navigation.navigate('Main', { screen: 'SearchTab', params: { tagId } });
        }}
        onAuthorPress={(userId) => {
          setSelectedSpotId(null);
          if (session?.user?.id === userId) {
            navigation.navigate('Main', { screen: 'MyPageTab' });
          } else {
            navigation.navigate('UserProfile', { userId });
          }
        }}
        onEdit={(slug) => {
          setSelectedSpotId(null);
          navigation.navigate('EditSpot', { spotId: slug });
        }}
        onAddReview={(slug) => {
          setSelectedSpotId(null);
          navigation.navigate('AddReview', { spotId: slug });
        }}
        onDeleted={() => {
          setSelectedSpotId(null);
          loadForBounds();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
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
    width: 44,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    width: 40,
    height: 40,
    backgroundColor: 'rgba(61,61,61,0.92)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
