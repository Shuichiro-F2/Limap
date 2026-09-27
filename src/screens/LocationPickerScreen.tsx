import React, { useRef, useState } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import LocationPickerLayout from '../components/LocationPickerLayout';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
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

  const cameraRef = useRef<Camera>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const sessionTokenRef = useRef(generateSessionToken());

  const onCameraChanged = (state: { properties: { center: number[] } }) => {
    const [lng, lat] = state.properties.center;
    setCenter({ lat, lng });
  };

  // 施設名などのフリーワード検索には、住所向けのGeocoding APIではなく
  // POI検索に強いSearch Box APIを使う（suggest→retrieveの2段階呼び出し）
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
      cameraRef.current?.setCamera({
        centerCoordinate: [place.lng, place.lat],
        zoomLevel: 16,
        animationDuration: 500,
      });
      setCenter(place);
    } catch (e) {
      console.warn('詳細取得エラー', e);
    } finally {
      // 1回の検索〜確定で1セッション。次の検索のために新しいトークンを発行する
      sessionTokenRef.current = generateSessionToken();
    }
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    cameraRef.current?.setCamera({
      centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
    setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const confirm = () => {
    if (route.params?.returnTo === 'EditSpot' && route.params.spotId) {
      navigation.navigate('EditSpot', {
        spotId: route.params.spotId,
        pickedLat: center.lat,
        pickedLng: center.lng,
      });
    } else {
      navigation.navigate('CreateSpot', { pickedLat: center.lat, pickedLng: center.lng });
    }
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
      <MapView
        style={styles.map}
        styleURL={MAP_STYLE}
        localizeLabels={{ locale: language }}
        onCameraChanged={onCameraChanged}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [initialLng, initialLat], zoomLevel: 13 }}
        />
      </MapView>
    </LocationPickerLayout>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
