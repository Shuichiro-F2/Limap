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
import InstagramEmbed from '../components/InstagramEmbed';
import XEmbed from '../components/XEmbed';
import { supabase } from '../lib/supabase';
import { fetchSpotBySlug, updateSpot, spotImageThumbUrl } from '../lib/spots';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import { fetchAllTags, findOrCreateTag } from '../lib/tags';
import { detectEmbedUrl, MAX_SNS_EMBEDS, type DetectedEmbed } from '../lib/embeds';
import { isValidHttpUrl } from '../lib/url';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { Tag, VisitTime, Spot, SpotImage } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_TAGS = 5;
const MAX_PHOTOS = 5;
const VISIT_TIME_OPTIONS: VisitTime[] = ['morning', 'daytime', 'dusk', 'night'];

// 「写真（最大{n}枚）」のような文言の{n}部分を実際の件数に置き換える
function fmt(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

type Props = RootStackScreenProps<'EditSpot'>;

export default function EditSpotScreen({ navigation, route }: Props) {
  const { spotId } = route.params;
  const { session } = useAuth();
  const t = useTranslation();

  const [loadingSpot, setLoadingSpot] = useState(true);
  const [spot, setSpot] = useState<Spot | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('');
  const [visitTime, setVisitTime] = useState<VisitTime | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [existingImages, setExistingImages] = useState<SpotImage[]>([]);
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [embeds, setEmbeds] = useState<DetectedEmbed[]>([]);
  const [embedInput, setEmbedInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: t.createSpot.editHeaderTitle });
  }, [t.createSpot.editHeaderTitle]);

  // URL直接アクセスなど、未ログインでこの画面に来た場合はログイン画面へ誘導する
  useEffect(() => {
    if (!session?.user) {
      navigation.replace('Auth');
    }
  }, [session?.user]);

  // 既存タグの候補一覧（新規タグはこの場で追加できる）
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  // 編集対象のスポットを読み込み、各フォーム項目の初期値として反映する
  useEffect(() => {
    if (!spotId) return;
    setLoadingSpot(true);
    fetchSpotBySlug(spotId)
      .then((data) => {
        if (session?.user && session.user.id !== data.author_id) {
          notify(t.createSpot.notOwnerTitle, '', () => navigation.goBack());
          return;
        }
        setSpot(data);
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setAccess(data.access ?? '');
        setVisitTime(data.recommended_visit_time ?? null);
        setGoogleMapsUrl(data.google_maps_url ?? '');
        setSelectedTags(data.tags ?? []);
        setExistingImages([...(data.images ?? [])].sort((a, b) => a.position - b.position));
        setCoords({ lat: data.lat, lng: data.lng });
        setEmbeds((data.embeds ?? []).map((e) => ({ platform: e.platform, url: e.url })));
      })
      .catch((e) => {
        console.warn('スポット取得エラー', e);
        notify(t.createSpot.spotLoadFailedTitle, e.message, () => navigation.goBack());
      })
      .finally(() => setLoadingSpot(false));
  }, [spotId, session?.user?.id]);

  // LocationPicker画面で選んだ座標をパラメータ経由で受け取る
  useEffect(() => {
    const { pickedLat, pickedLng } = route.params ?? {};
    if (pickedLat != null && pickedLng != null) {
      setCoords({ lat: pickedLat, lng: pickedLng });
    }
  }, [route.params?.pickedLat, route.params?.pickedLng]);

  const totalImageCount = existingImages.length + newImages.length;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify(t.createSpot.photoPermissionTitle);
      return;
    }
    const remaining = MAX_PHOTOS - totalImageCount;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: remaining,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets].slice(0, remaining));
    }
  };

  const removeExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      notify(t.createSpot.locationPermissionTitle);
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
      notify(t.createSpot.tagAddFailedTitle, e.message);
    } finally {
      setAddingTag(false);
    }
  };

  // 「SNSで話題の場所」を紹介するためのInstagram/X投稿URL(最大MAX_SNS_EMBEDS件)。
  // 入力されたURLからプラットフォーム(Instagram/X)を自動判定する。
  const addEmbedUrl = () => {
    const url = embedInput.trim();
    if (!url) return;
    if (embeds.length >= MAX_SNS_EMBEDS) return;
    const detected = detectEmbedUrl(url);
    if (!detected) {
      notify(t.createSpot.embedInvalidTitle, t.createSpot.embedInvalidMessage);
      return;
    }
    if (embeds.some((e) => e.url === detected.url)) {
      setEmbedInput('');
      return;
    }
    setEmbeds((prev) => [...prev, detected]);
    setEmbedInput('');
  };

  const removeEmbedUrl = (url: string) => {
    setEmbeds((prev) => prev.filter((e) => e.url !== url));
  };

  // 訪問時間帯オプションの表示ラベルを選択中の言語で取得する
  const visitTimeLabel = (opt: VisitTime) => {
    switch (opt) {
      case 'morning':
        return t.createSpot.visitTimeMorning;
      case 'daytime':
        return t.createSpot.visitTimeDaytime;
      case 'dusk':
        return t.createSpot.visitTimeDusk;
      case 'night':
        return t.createSpot.visitTimeNight;
    }
  };

  const tagSuggestions = tagInput.trim()
    ? allTags
        .filter(
          (tag) =>
            tag.name.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
            !selectedTags.some((s) => s.id === tag.id)
        )
        .slice(0, 6)
    : [];

  const submit = async () => {
    if (!session?.user || !spot) {
      notify(t.createSpot.loginRequiredTitle);
      return;
    }
    if (session.user.id !== spot.author_id) {
      notify(t.createSpot.notOwnerTitle);
      return;
    }
    if (!coords) {
      notify(t.createSpot.locationRequiredTitle);
      return;
    }

    // SNS投稿入力欄に文字が残ったまま「追加」を押し忘れて保存されてしまうケースを防ぐため、
    // 未追加のURLが残っていればここで検証したうえで自動的に含める。
    let finalEmbeds = embeds;
    const pendingEmbedInput = embedInput.trim();
    if (pendingEmbedInput) {
      const detected = detectEmbedUrl(pendingEmbedInput);
      if (!detected) {
        notify(t.createSpot.embedInvalidTitle, t.createSpot.embedInvalidMessage);
        return;
      }
      if (!finalEmbeds.some((e) => e.url === detected.url) && finalEmbeds.length < MAX_SNS_EMBEDS) {
        finalEmbeds = [...finalEmbeds, detected];
        setEmbeds(finalEmbeds);
        setEmbedInput('');
      }
    }

    // 写真・SNS投稿のどちらか一方は必須(何のメディアも無い投稿を防ぐため)
    if (existingImages.length === 0 && newImages.length === 0 && finalEmbeds.length === 0) {
      notify(t.createSpot.mediaRequiredTitle);
      return;
    }

    const trimmedGoogleMapsUrl = googleMapsUrl.trim();
    if (trimmedGoogleMapsUrl && !isValidHttpUrl(trimmedGoogleMapsUrl)) {
      notify(t.createSpot.googleMapsUrlInvalidTitle, t.createSpot.googleMapsUrlInvalidMessage);
      return;
    }

    setSubmitting(true);
    try {
      const newImagePaths: { path: string; thumbnailPath: string | null }[] = [];
      for (const asset of newImages) {
        if (!asset.base64) continue;
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
          if (thumbError) {
            console.warn('サムネイルアップロードエラー', thumbError);
          } else {
            thumbnailPath = path;
          }
        }

        newImagePaths.push({ path: fullPath, thumbnailPath });
      }

      const derivedTitle = title.trim() || description.trim().slice(0, 40) || '無題の投稿';

      const updated = await updateSpot(spot, {
        title: derivedTitle,
        description: description.trim() || undefined,
        access: access.trim() || undefined,
        recommendedVisitTime: visitTime ?? undefined,
        googleMapsUrl: trimmedGoogleMapsUrl || undefined,
        lat: coords.lat,
        lng: coords.lng,
        tagIds: selectedTags.map((tag) => tag.id),
        keepImageIds: existingImages.map((img) => img.id),
        newImagePaths,
        embedUrls: finalEmbeds.map((e) => e.url),
      });

      // 更新後は編集前にいた詳細画面へ戻る
      notify(t.createSpot.updateSuccessTitle, '', () =>
        navigation.navigate('SpotDetail', { spotId: updated.slug })
      );
    } catch (e: any) {
      notify(t.createSpot.updateFailedTitle, e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    );
  }

  if (!spot) {
    return <View style={styles.center} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <SectionLabel label={t.createSpot.name} help={t.createSpot.nameHelp} />
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={t.createSpot.namePlaceholder}
        placeholderTextColor="#666"
        maxLength={60}
      />

      <SectionLabel label={t.createSpot.location} help={t.createSpot.locationHelp} required />
      {coords && (
        <Text style={styles.coordsSetText}>
          {t.createSpot.locationSet} ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
        </Text>
      )}
      <View style={styles.locationRow}>
        <Pressable style={[styles.secondaryButton, styles.locationButton]} onPress={useCurrentLocation}>
          <Text style={styles.secondaryButtonText}>{t.createSpot.useCurrentLocation}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, styles.locationButton]}
          onPress={() =>
            navigation.navigate('LocationPicker', {
              initialLat: coords?.lat,
              initialLng: coords?.lng,
              returnTo: 'EditSpot',
              spotId,
            })
          }
        >
          <Text style={styles.secondaryButtonText}>{t.createSpot.chooseOnMap}</Text>
        </Pressable>
      </View>

      <SectionLabel label={t.createSpot.googleMapsUrl} help={t.createSpot.googleMapsUrlHelp} />
      <TextInput
        style={styles.input}
        value={googleMapsUrl}
        onChangeText={setGoogleMapsUrl}
        placeholder={t.createSpot.googleMapsUrlPlaceholder}
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <SectionLabel label={t.createSpot.access} help={t.createSpot.accessHelp} />
      <TextInput
        style={styles.input}
        value={access}
        onChangeText={setAccess}
        placeholder={t.createSpot.accessPlaceholder}
        placeholderTextColor="#666"
        multiline
      />

      <SectionLabel label={t.createSpot.visitTime} help={t.createSpot.visitTimeHelp} />
      <View style={styles.tagGrid}>
        {VISIT_TIME_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.tagOption, visitTime === opt && styles.tagOptionSelected]}
            onPress={() => setVisitTime((prev) => (prev === opt ? null : opt))}
          >
            <Text style={visitTime === opt ? styles.tagOptionTextSelected : styles.tagOptionText}>
              {visitTimeLabel(opt)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.mediaRequiredNote}>{t.createSpot.mediaRequiredNote}</Text>

      <SectionLabel label={t.createSpot.photos} help={fmt(t.createSpot.photosHelp, MAX_PHOTOS)} />
      <Pressable style={styles.secondaryButton} onPress={pickImages} disabled={totalImageCount >= MAX_PHOTOS}>
        <Text style={styles.secondaryButtonText}>{t.createSpot.pickPhotos}</Text>
      </Pressable>
      <ScrollView horizontal style={{ marginTop: 12 }}>
        {existingImages.map((img) => (
          <View key={img.id} style={styles.thumbWrap}>
            <Image source={{ uri: spotImageThumbUrl(img) }} style={styles.thumb} />
            <Pressable style={styles.thumbRemove} onPress={() => removeExistingImage(img.id)} hitSlop={8}>
              <Text style={styles.thumbRemoveText}>✕</Text>
            </Pressable>
          </View>
        ))}
        {newImages.map((img, i) => (
          <View key={`new-${i}`} style={styles.thumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <Pressable style={styles.thumbRemove} onPress={() => removeNewImage(i)} hitSlop={8}>
              <Text style={styles.thumbRemoveText}>✕</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <SectionLabel label={t.createSpot.embeds} help={fmt(t.createSpot.embedsHelp, MAX_SNS_EMBEDS)} />

      {embeds.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          {embeds.map((e) => (
            <View key={e.url} style={styles.embedPreviewWrap}>
              <View style={styles.embedRow}>
                <Text style={styles.embedPlatformTag}>{e.platform === 'instagram' ? 'Instagram' : 'X'}</Text>
                <Text style={styles.embedUrlText} numberOfLines={1}>
                  {e.url}
                </Text>
                <Pressable onPress={() => removeEmbedUrl(e.url)} hitSlop={8}>
                  <Text style={styles.embedRemoveText}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.embedPreviewBox}>
                {e.platform === 'instagram' ? <InstagramEmbed url={e.url} /> : <XEmbed url={e.url} />}
              </View>
            </View>
          ))}
        </View>
      )}

      {embeds.length >= MAX_SNS_EMBEDS ? (
        <Text style={styles.tagLimitText}>{fmt(t.createSpot.embedLimitTemplate, MAX_SNS_EMBEDS)}</Text>
      ) : (
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            value={embedInput}
            onChangeText={setEmbedInput}
            placeholder={t.createSpot.embedPlaceholder}
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={addEmbedUrl}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.secondaryButton, styles.tagAddButton]}
            onPress={addEmbedUrl}
            disabled={!embedInput.trim()}
          >
            <Text style={styles.secondaryButtonText}>{t.createSpot.add}</Text>
          </Pressable>
        </View>
      )}

      <SectionLabel label={t.createSpot.hashtags} help={fmt(t.createSpot.hashtagsHelp, MAX_TAGS)} />

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
        <Text style={styles.tagLimitText}>{fmt(t.createSpot.hashtagLimitTemplate, MAX_TAGS)}</Text>
      ) : (
        <>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder={t.createSpot.hashtagPlaceholder}
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
                <Text style={styles.secondaryButtonText}>{t.createSpot.add}</Text>
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

      <SectionLabel label={t.createSpot.description} help={t.createSpot.descriptionHelp} />
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t.createSpot.descriptionPlaceholder}
        placeholderTextColor="#666"
        multiline
      />

      <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.submitButtonText}>{t.createSpot.save}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

// セクション見出し＋(あれば)必須マーク＋「?」ボタン。
// 「?」を押すとhelpの説明文だけがその場に展開される。デフォルトでは畳んだ状態にして
// おくことで、投稿画面全体を細かい説明文だらけにせずミニマルな見た目に保つ。
function SectionLabel({ label, help, required }: { label: string; help?: string; required?: boolean }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <View>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredMark}>*</Text>}
        {help && (
          <Pressable
            onPress={() => setShowHelp((v) => !v)}
            hitSlop={8}
            style={[styles.helpButton, showHelp && styles.helpButtonActive]}
          >
            <Text style={[styles.helpButtonText, showHelp && styles.helpButtonTextActive]}>?</Text>
          </Pressable>
        )}
      </View>
      {help && showHelp && <Text style={styles.helpText}>{help}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 8,
  },
  label: { color: colors.textSecondary, fontSize: 13 },
  requiredMark: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  helpButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  helpButtonText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  helpButtonTextActive: { color: colors.accentText },
  helpText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  mediaRequiredNote: { color: colors.accent, fontSize: 12, marginTop: 20 },
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
  embedPreviewWrap: { marginBottom: 14 },
  embedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  embedPlatformTag: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  embedUrlText: { flex: 1, color: colors.textSecondary, fontSize: 12, marginRight: 8 },
  embedRemoveText: { color: colors.textMuted, fontSize: 14 },
  embedPreviewBox: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.background },
  thumbWrap: { marginRight: 8 },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: colors.textPrimary, fontSize: 12 },
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
