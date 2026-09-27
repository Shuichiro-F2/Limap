// Web版の位置ピッカー画面。ネイティブ版(LocationPickerScreen.tsx)と同じUI・操作感を
// mapbox-gl-js（react-map-gl）で再現している。
import React, { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import LocationPickerLayout from '../components/LocationPickerLayout';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { generateSessionToken, suggestPlaces, retrievePlace, type SuggestResult } from '../lib/mapboxSearch';
import { useLanguage } from '../lib/i18n';
import type { RootStackScreenProps } from '../navigation/types';

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type Props = RootStackScreenProps<'LocationPicker'>;

export default function LocationPickerScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
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
    <LocationPickerLayout
      query={query}
      onChangeQuery={(text) => {
        setQuery(text);
        if (!text) setResults([]);
      }}
      onSearch={search}
      searching={searching}
      results={results}
      onSelectResult={selectResult}
      onLocate={useCurrentLocation}
      center={center}
      onConfirm={confirm}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
        language={language}
        initialViewState={{ latitude: initialLat, longitude: initialLng, zoom: 13 }}
        style={{ width: '100%', height: '100%' }}
        onMoveEnd={onMoveEnd}
      />
    </LocationPickerLayout>
  );
}
