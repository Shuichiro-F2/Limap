import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { supabase } from '../lib/supabase';
import { createSpot } from '../lib/spots';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import { fetchAllTags, findOrCreateTag } from '../lib/tags';
import { isValidInstagramUrl, normalizeInstagramUrl, MAX_INSTAGRAM_EMBEDS } from '../lib/instagram';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { Tag } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_TAGS = 5;

type Props = RootStackScreenProps<'CreateSpot'>;

export default function CreateSpotScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [instagramUrls, setInstagramUrls] = useState<string[]>([]);
  const [instagramInput, setInstagramInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 既存タグの候補一覧（新規タグはこの場で追加できる）
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  // URL直接アクセスなど、未ログインでこの画面に来た場合はログイン画面へ誘導する
  useEffect(() => {
    if (!session?.user) {
      navigation.replace('Auth');
    }
  }, [session?.user]);

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

  const addTag = (tag: Tag) => {
    if (selectedTags.length >= MAX_TAGS) return;
    setSelectedTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
    setTagInput('');
  };

  const removeTag = (id: number) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== id));
  };

  // 入力中の文字列から、既存タグにあればそれを使い、なければ新規作成して追加する
  const addTagFromInput = async () => {
    const name = tagInput.trim();
    if (!name || selectedTags.length >= MAX_TAGS) return;
    if (selectedTags.some((t) => t.name === name)) {
      setTagInput('');
      return;
    }
    setAddingTag(true);
    try {
      const tag = await findOrCreateTag(name);
      setSelectedTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      setAllTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      setTagInput('');
    } catch (e: any) {
      notify('タグの追加に失敗しました', e.message);
    } finally {
      setAddingTag(false);
    }
  };

  // 「SNSで話題の場所」を紹介するためのInstagram投稿URL(最大MAX_INSTAGRAM_EMBEDS件)
  const addInstagramUrl = () => {
    const url = instagramInput.trim();
    if (!url) return;
    if (instagramUrls.length >= MAX_INSTAGRAM_EMBEDS) return;
    if (!isValidInstagramUrl(url)) {
      notify('Instagram投稿のURLが正しくありません', '投稿ページのURL(https://www.instagram.com/p/... など)を入力してください');
      return;
    }
    const normalized = normalizeInstagramUrl(url);
    if (instagramUrls.includes(normalized)) {
      setInstagramInput('');
      return;
    }
    setInstagramUrls((prev) => [...prev, normalized]);
    setInstagramInput('');
  };

  const removeInstagramUrl = (url: string) => {
    setInstagramUrls((prev) => prev.filter((u) => u !== url));
  };

  const tagSuggestions = tagInput.trim()
    ? allTags
        .filter(
          (t) =>
            t.name.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
            !selectedTags.some((s) => s.id === t.id)
        )
        .slice(0, 6)
    : [];

  const submit = async () => {
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    if (!coords) {
      notify('位置情報を設定してください');
      return;
    }

    // Instagram入力欄に文字が残ったまま「追加」を押し忘れて投稿されてしまうケースを防ぐため、
    // 未追加のURLが残っていればここで検証したうえで自動的に含める。
    let finalInstagramUrls = instagramUrls;
    const pendingInstagramInput = instagramInput.trim();
    if (pendingInstagramInput) {
      if (!isValidInstagramUrl(pendingInstagramInput)) {
        notify(
          'Instagram投稿のURLが正しくありません',
          '入力欄に未追加のURLが残っています。投稿ページのURL(https://www.instagram.com/p/... など)を確認するか、欄を空にしてください'
        );
        return;
      }
      const normalized = normalizeInstagramUrl(pendingInstagramInput);
      if (!finalInstagramUrls.includes(normalized) && finalInstagramUrls.length < MAX_INSTAGRAM_EMBEDS) {
        finalInstagramUrls = [...finalInstagramUrls, normalized];
        setInstagramUrls(finalInstagramUrls);
        setInstagramInput('');
      }
    }

    setSubmitting(true);
    try {
      const imagePaths: { path: string; thumbnailPath: string | null }[] = [];
      for (const asset of images) {
        if (!asset.base64) continue;
        // 大きい写真をそのままアップロードすると、マイページや検索のグリッド表示時に
        // 毎回高解像度のまま画像をデコードすることになり動作が重くなる(投稿数の多い
        // アカウントのプロフィール画面などで再読み込みが繰り返される主因になっていた)。
        // そのため、詳細画面表示用の縮小版(full)に加えて、グリッド/カード表示専用の
        // より小さいサムネイル(thumbnail)も別途生成してアップロードする。
        // どちらもWebP形式に変換し、同品質のJPEGよりファイルサイズを抑える。
        const [full, thumbnail] = await Promise.all([
          resizeImageForUpload(asset.uri, asset.base64),
          resizeImageForUpload(asset.uri, asset.base64, THUMBNAIL_RESIZE_OPTIONS),
        ]);
        if (!full) continue;

        const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fullPath = `${session.user.id}/${uid}.${extensionForContentType(full.contentType)}`;
        const { error: fullError } = await supabase.storage
          .from('spot-images')
          .upload(fullPath, decode(full.base64), { contentType: full.contentType });
        if (fullError) throw fullError;

        let thumbnailPath: string | null = null;
        if (thumbnail) {
          const path = `${session.user.id}/${uid}-thumb.${extensionForContentType(thumbnail.contentType)}`;
          const { error: thumbError } = await supabase.storage
            .from('spot-images')
            .upload(path, decode(thumbnail.base64), { contentType: thumbnail.contentType });
          // サムネイルのアップロードに失敗しても、フル画像だけで投稿自体は継続できるようにする
          // (表示側はthumbnail_pathがnullならフル画像にフォールバックする)
          if (thumbError) {
            console.warn('サムネイルアップロードエラー', thumbError);
          } else {
            thumbnailPath = path;
          }
        }

        imagePaths.push({ path: fullPath, thumbnailPath });
      }

      // タイトル欄は廃止したため、説明文の冒頭から内部用のタイトルを自動生成する
      // （検索やグリッド表示のフォールバックなど、内部的にのみ使用する）
      const derivedTitle = description.trim().slice(0, 40) || '無題の投稿';

      await createSpot(session.user.id, {
        title: derivedTitle,
        description: description.trim() || undefined,
        lat: coords.lat,
        lng: coords.lng,
        tagIds: selectedTags.map((t) => t.id),
        imagePaths,
        instagramUrls: finalInstagramUrls,
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

      <Text style={styles.label}>雰囲気タグ（最大{MAX_TAGS}個）</Text>

      {selectedTags.length > 0 && (
        <View style={styles.tagGrid}>
          {selectedTags.map((tag) => (
            <Pressable
              key={tag.id}
              style={[styles.tagOption, styles.tagOptionSelected]}
              onPress={() => removeTag(tag.id)}
            >
              <Text style={styles.tagOptionTextSelected}>{tag.name} ✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selectedTags.length >= MAX_TAGS ? (
        <Text style={styles.tagLimitText}>タグは{MAX_TAGS}個まで設定できます</Text>
      ) : (
        <>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="タグを入力（新規作成も可）"
              placeholderTextColor="#666"
              onSubmitEditing={addTagFromInput}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.secondaryButton, styles.tagAddButton]}
              onPress={addTagFromInput}
              disabled={addingTag || !tagInput.trim()}
            >
              {addingTag ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : (
                <Text style={styles.secondaryButtonText}>追加</Text>
              )}
            </Pressable>
          </View>

          {tagSuggestions.length > 0 && (
            <View style={styles.tagGrid}>
              {tagSuggestions.map((tag) => (
                <Pressable key={tag.id} style={styles.tagOption} onPress={() => addTag(tag)}>
                  <Text style={styles.tagOptionText}>{tag.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={styles.label}>写真（最大5枚）</Text>
      <Pressable style={styles.secondaryButton} onPress={pickImages}>
        <Text style={styles.secondaryButtonText}>写真を選択</Text>
      </Pressable>
      <ScrollView horizontal style={{ marginTop: 12 }}>
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img.uri }} style={styles.thumb} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Instagram投稿（最大{MAX_INSTAGRAM_EMBEDS}件・任意）</Text>
      <Text style={styles.helperText}>
        SNSで話題になっている場所であれば、関連するInstagram投稿のURLを追加すると詳細画面に埋め込み表示されます。
      </Text>

      {instagramUrls.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          {instagramUrls.map((url) => (
            <View key={url} style={styles.instagramRow}>
              <Text style={styles.instagramUrlText} numberOfLines={1}>
                {url}
              </Text>
              <Pressable onPress={() => removeInstagramUrl(url)} hitSlop={8}>
                <Text style={styles.instagramRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {instagramUrls.length >= MAX_INSTAGRAM_EMBEDS ? (
        <Text style={styles.tagLimitText}>Instagram投稿は{MAX_INSTAGRAM_EMBEDS}件まで設定できます</Text>
      ) : (
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            value={instagramInput}
            onChangeText={setInstagramInput}
            placeholder="https://www.instagram.com/p/..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={addInstagramUrl}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.secondaryButton, styles.tagAddButton]}
            onPress={addInstagramUrl}
            disabled={!instagramInput.trim()}
          >
            <Text style={styles.secondaryButtonText}>追加</Text>
          </Pressable>
        </View>
      )}

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
  tagInputRow: { flexDirection: 'row', gap: 8 },
  tagInput: { flex: 1 },
  tagAddButton: { paddingHorizontal: 18 },
  tagLimitText: { color: colors.textMuted, fontSize: 12 },
  helperText: { color: colors.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 17 },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  instagramUrlText: { flex: 1, color: colors.textSecondary, fontSize: 12, marginRight: 8 },
  instagramRemoveText: { color: colors.textMuted, fontSize: 14 },
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
