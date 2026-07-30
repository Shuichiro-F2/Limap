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
import Mapbox, { Camera, MapView, PointAnnotation, UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { fetchSpotsInBounds } from '../lib/spots';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import SpotPreviewSheet from '../components/SpotPreviewSheet';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// リミナルスペースらしい、彩度を落とした暗めのマップスタイル
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type Props = MainTabScreenProps<'MapTab'>;

export default function MapScreen({ navigation, route }: Props) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

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
        {spots.map((spot) => (
          <PointAnnotation
            key={spot.id}
            id={spot.id}
            coordinate={[spot.lng, spot.lat]}
            onSelected={() => setSelectedSpotId(spot.id)}
          >
            <View style={styles.pin} />
          </PointAnnotation>
        ))}
      </MapView>

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
          cameraRef.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 15,
            animationDuration: 500,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
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
