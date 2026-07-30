// Web版の位置ピッカー画面。ネイティブ版(LocationPickerScreen.tsx)と同じUI・操作感を
// mapbox-gl-js（react-map-gl）で再現している。
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type Props = RootStackScreenProps<'LocationPicker'>;

export default function LocationPickerScreen({ navigation, route }: Props) {
  const initialLat = route.params?.initialLat ?? 35.681;
  const initialLng = route.params?.initialLng ?? 139.767;

  const mapRef = useRef<MapRef>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const sessionTokenRef = useRef(generateSessionToken());

  const onMoveEnd = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setCenter({ lat: c.lat, lng: c.lng });
  };

  const search = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      const items = await suggestPlaces(query, sessionTokenRef.current, center);
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
      mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: 16, duration: 500 });
      setCenter(place);
    } catch (e) {
      console.warn('詳細取得エラー', e);
    } finally {
      sessionTokenRef.current = generateSessionToken();
    }
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.flyTo({ center: [loc.coords.longitude, loc.coords.latitude], zoom: 15, duration: 500 });
    setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const confirm = () => {
    navigation.navigate('CreateSpot', { pickedLat: center.lat, pickedLng: center.lng });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="住所や地名で検索"
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

      <View style={styles.mapWrap}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={MAP_STYLE}
          initialViewState={{ latitude: initialLat, longitude: initialLng, zoom: 13 }}
          style={{ width: '100%', height: '100%' }}
          onMoveEnd={onMoveEnd}
        />
        {/* 地図中央に固定表示するピン。地図側ではなくオーバーレイとして描画することで
            「地図を動かして中央に場所を合わせる」操作を実現している */}
        <View pointerEvents="none" style={styles.centerPin}>
          <View style={styles.pinDot} />
          <View style={styles.pinStick} />
        </View>

        <Pressable style={styles.locateButton} onPress={useCurrentLocation}>
          <Text style={styles.locateButtonText}>現在地</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.coordText}>
          {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
        </Text>
        <Pressable style={styles.confirmButton} onPress={confirm}>
          <Text style={styles.confirmButtonText}>この場所に設定</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
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
    maxHeight: 220,
    backgroundColor: colors.surfaceAlt,
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
  mapWrap: { flex: 1 },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -34,
    alignItems: 'center',
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: '#fff',
  },
  pinStick: {
    width: 2,
    height: 16,
    backgroundColor: colors.accent,
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(61,61,61,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  locateButtonText: { color: colors.textPrimary, fontSize: 13 },
  footer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coordText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
});
