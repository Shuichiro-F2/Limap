import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { createSpot } from '../lib/spots';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

const AVAILABLE_TAGS = [
  { id: 1, name: '廃墟' },
  { id: 2, name: '深夜' },
  { id: 3, name: '無人駅' },
  { id: 4, name: '地下道' },
  { id: 5, name: '駐車場' },
  { id: 6, name: '団地' },
  { id: 7, name: '遊園地跡' },
  { id: 8, name: '海外' },
  { id: 9, name: '雨の日' },
  { id: 10, name: '人工照明' },
];

type Props = RootStackScreenProps<'CreateSpot'>;

export default function CreateSpotScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // LocationPicker画面で選んだ座標をパラメータ経由で受け取る
  useEffect(() => {
    const { pickedLat, pickedLng } = route.params ?? {};
    if (pickedLat != null && pickedLng != null) {
      setCoords({ lat: pickedLat, lng: pickedLng });
    }
  }, [route.params?.pickedLat, route.params?.pickedLng]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('写真ライブラリへのアクセス許可が必要です');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      notify('位置情報の許可が必要です');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    if (!title.trim()) {
      notify('タイトルを入力してください');
      return;
    }
    if (!coords) {
      notify('位置情報を設定してください');
      return;
    }

    setSubmitting(true);
    try {
      const imagePaths: string[] = [];
      for (const asset of images) {
        if (!asset.base64) continue;
        const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage
          .from('spot-images')
          .upload(path, decode(asset.base64), { contentType: 'image/jpeg' });
        if (error) throw error;
        imagePaths.push(path);
      }

      await createSpot(session.user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        lat: coords.lat,
        lng: coords.lng,
        tagIds: selectedTags,
        imagePaths,
      });

      notify('投稿しました', '', () => navigation.goBack());
    } catch (e: any) {
      notify('投稿に失敗しました', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>タイトル</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="例：深夜の無人駅ホーム"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>説明</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="場所の雰囲気や見つけ方など"
        placeholderTextColor="#666"
        multiline
      />

      <Text style={styles.label}>位置情報</Text>
      {coords && (
        <Text style={styles.coordsSetText}>
          設定済み ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
        </Text>
      )}
      <View style={styles.locationRow}>
        <Pressable style={[styles.secondaryButton, styles.locationButton]} onPress={useCurrentLocation}>
          <Text style={styles.secondaryButtonText}>現在地を使用</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, styles.locationButton]}
          onPress={() =>
            navigation.navigate('LocationPicker', {
              initialLat: coords?.lat,
              initialLng: coords?.lng,
            })
          }
        >
          <Text style={styles.secondaryButtonText}>地図から選択</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>雰囲気タグ</Text>
      <View style={styles.tagGrid}>
        {AVAILABLE_TAGS.map((tag) => (
          <Pressable
            key={tag.id}
            style={[styles.tagOption, selectedTags.includes(tag.id) && styles.tagOptionSelected]}
            onPress={() => toggleTag(tag.id)}
          >
            <Text
              style={[
                styles.tagOptionText,
                selectedTags.includes(tag.id) && styles.tagOptionTextSelected,
              ]}
            >
              {tag.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>写真（最大5枚）</Text>
      <Pressable style={styles.secondaryButton} onPress={pickImages}>
        <Text style={styles.secondaryButtonText}>写真を選択</Text>
      </Pressable>
      <ScrollView horizontal style={{ marginTop: 12 }}>
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img.uri }} style={styles.thumb} />
        ))}
      </ScrollView>

      <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.submitButtonText}>投稿する</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 14 },
  locationRow: { flexDirection: 'row', gap: 10 },
  locationButton: { flex: 1 },
  coordsSetText: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagOptionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  tagOptionText: { color: colors.textSecondary, fontSize: 13 },
  tagOptionTextSelected: { color: colors.accentText, fontWeight: '600' },
  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  submitButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
});
