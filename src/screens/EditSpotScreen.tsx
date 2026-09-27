import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import InstagramEmbed from '../components/InstagramEmbed';
import XEmbed from '../components/XEmbed';
import { supabase } from '../lib/supabase';
import { fetchSpotBySlug, updateSpot, spotImageThumbUrl, MAX_TAGS_PER_SPOT } from '../lib/spots';
import type { UpdateSpotImageRef } from '../lib/spots';
import PhotoEditList, { movePhoto } from '../components/PhotoEditList';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import { fetchAllTags, findOrCreateTag } from '../lib/tags';
import { detectEmbedUrl, MAX_SNS_EMBEDS, type DetectedEmbed } from '../lib/embeds';
import { isValidHttpUrl } from '../lib/url';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/notify';
import { colors, radius, space, type } from '../lib/theme';
import { Button, ChoiceRow, Chip, FormField, FormFooter, FormInput, FormScreen, FormSection, formStyles } from '../components/Form';
import type { Tag, VisitTime, Spot, SpotImage } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_TAGS = MAX_TAGS_PER_SPOT;
const MAX_PHOTOS = 5;
const VISIT_TIME_OPTIONS: VisitTime[] = ['morning', 'daytime', 'dusk', 'night'];

// 「写真（最大{n}枚）」のような文言の{n}部分を実際の件数に置き換える
function fmt(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

type Props = RootStackScreenProps<'EditSpot'>;

// 編集画面では「もともと登録されている画像」と「今回追加した画像」を
// 1つの配列でまとめて扱う。こうすることで、両者をまたいだ並べ替えができる
// (以前は既存画像・新規画像が別々の配列で、新規は必ず既存の後ろに付いていた)。
type EditableImage =
  | { kind: 'existing'; image: SpotImage }
  | { kind: 'new'; asset: ImagePicker.ImagePickerAsset };

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
  const [imageItems, setImageItems] = useState<EditableImage[]>([]);
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
        setImageItems(
          [...(data.images ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((image) => ({ kind: 'existing' as const, image }))
        );
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

  const totalImageCount = imageItems.length;

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
      const added = result.assets
        .slice(0, remaining)
        .map((asset) => ({ kind: 'new' as const, asset }));
      setImageItems((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
    }
  };

  const removeImage = (index: number) => {
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImageItems((prev) => movePhoto(prev, index, direction));
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
    if (imageItems.length === 0 && finalEmbeds.length === 0) {
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
      // 画面上の並び順のまま処理する。新規画像はここでアップロードし、
      // 既存画像はidのまま並びに残すことで、両者が混在した順番を保てる。
      const imageOrder: UpdateSpotImageRef[] = [];
      for (const item of imageItems) {
        if (item.kind === 'existing') {
          imageOrder.push({ kind: 'existing', id: item.image.id });
          continue;
        }
        const asset = item.asset;
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

        imageOrder.push({ kind: 'new', path: fullPath, thumbnailPath });
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
        imageOrder,
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
    <FormScreen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <FormSection first title={t.createSpot.sectionSpot}>
          <FormField label={t.createSpot.name} help={t.createSpot.nameHelp}>
            <FormInput
              value={title}
              onChangeText={setTitle}
              placeholder={t.createSpot.namePlaceholder}
              maxLength={60}
            />
          </FormField>

          <FormField label={t.createSpot.description} help={t.createSpot.descriptionHelp}>
            <FormInput
              value={description}
              onChangeText={setDescription}
              placeholder={t.createSpot.descriptionPlaceholder}
              multiline
            />
          </FormField>
        </FormSection>

        <FormSection title={t.createSpot.sectionMedia} note={t.createSpot.mediaRequiredNote}>
          <FormField label={t.createSpot.photos} help={fmt(t.createSpot.photosHelp, MAX_PHOTOS)}>
            <Button
              variant="secondary"
              icon="images-outline"
              label={t.createSpot.pickPhotos}
              onPress={pickImages}
              disabled={totalImageCount >= MAX_PHOTOS}
            />
            <PhotoEditList
              items={imageItems.map((item) =>
                item.kind === 'existing' ? { uri: spotImageThumbUrl(item.image) } : { uri: item.asset.uri }
              )}
              onRemove={removeImage}
              onMove={moveImage}
            />
          </FormField>

          <FormField label={t.createSpot.embeds} help={fmt(t.createSpot.embedsHelp, MAX_SNS_EMBEDS)}>
            {embeds.map((e) => (
              <View key={e.url} style={styles.embedItem}>
                <View style={styles.embedRow}>
                  <Text style={styles.embedPlatformTag}>{e.platform === 'instagram' ? 'Instagram' : 'X'}</Text>
                  <Text variant="body" style={styles.embedUrlText} numberOfLines={1}>
                    {e.url}
                  </Text>
                  <Pressable onPress={() => removeEmbedUrl(e.url)} hitSlop={8} accessibilityRole="button">
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
                {/* 登録した投稿がどう見えるかその場で確認できるよう、実際の埋め込みをプレビュー表示する */}
                <View style={styles.embedPreviewBox}>
                  {e.platform === 'instagram' ? <InstagramEmbed url={e.url} /> : <XEmbed url={e.url} />}
                </View>
              </View>
            ))}
            {embeds.length >= MAX_SNS_EMBEDS ? (
              <Text variant="body" style={formStyles.caption}>
                {fmt(t.createSpot.embedLimitTemplate, MAX_SNS_EMBEDS)}
              </Text>
            ) : (
              <View style={formStyles.inputRow}>
                <FormInput
                  style={styles.flex}
                  value={embedInput}
                  onChangeText={setEmbedInput}
                  placeholder={t.createSpot.embedPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={addEmbedUrl}
                  returnKeyType="done"
                />
                <Button
                  compact
                  variant="secondary"
                  label={t.createSpot.add}
                  onPress={addEmbedUrl}
                  disabled={!embedInput.trim()}
                />
              </View>
            )}
          </FormField>
        </FormSection>

        <FormSection title={t.createSpot.sectionPlace}>
          <FormField label={t.createSpot.location} help={t.createSpot.locationHelp} required>
            {coords && (
              <View style={styles.coordsRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                <Text variant="body" style={styles.coordsText}>
                  {t.createSpot.locationSet} ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
                </Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <Button
                style={styles.flex}
                variant="secondary"
                icon="locate-outline"
                label={t.createSpot.useCurrentLocation}
                onPress={useCurrentLocation}
              />
              <Button
                style={styles.flex}
                variant="secondary"
                icon="map-outline"
                label={t.createSpot.chooseOnMap}
                onPress={() =>
                  navigation.navigate('LocationPicker', {
                    initialLat: coords?.lat,
                    initialLng: coords?.lng,
                    returnTo: 'EditSpot',
                    spotId,
                  })
                }
              />
            </View>
          </FormField>

          <FormField label={t.createSpot.googleMapsUrl} help={t.createSpot.googleMapsUrlHelp}>
            <FormInput
              value={googleMapsUrl}
              onChangeText={setGoogleMapsUrl}
              placeholder={t.createSpot.googleMapsUrlPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>

          <FormField label={t.createSpot.access} help={t.createSpot.accessHelp}>
            <FormInput
              style={styles.accessInput}
              value={access}
              onChangeText={setAccess}
              placeholder={t.createSpot.accessPlaceholder}
              multiline
            />
          </FormField>
        </FormSection>

        <FormSection title={t.createSpot.sectionMore}>
          <FormField label={t.createSpot.visitTime} help={t.createSpot.visitTimeHelp}>
            <ChoiceRow
              options={VISIT_TIME_OPTIONS.map((opt) => ({ value: opt, label: visitTimeLabel(opt) }))}
              value={visitTime}
              onChange={setVisitTime}
              allowDeselect
            />
          </FormField>

          <FormField label={t.createSpot.hashtags} help={fmt(t.createSpot.hashtagsHelp, MAX_TAGS)}>
            {selectedTags.length > 0 && (
              <View style={formStyles.chipRow}>
                {selectedTags.map((tag) => (
                  <Chip key={tag.id} label={tag.name} selected removable onPress={() => removeTag(tag.id)} />
                ))}
              </View>
            )}

            {selectedTags.length >= MAX_TAGS ? (
              <Text variant="body" style={formStyles.caption}>
                {fmt(t.createSpot.hashtagLimitTemplate, MAX_TAGS)}
              </Text>
            ) : (
              <>
                <View style={formStyles.inputRow}>
                  <FormInput
                    style={styles.flex}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder={t.createSpot.hashtagPlaceholder}
                    onSubmitEditing={addTagFromInput}
                    returnKeyType="done"
                  />
                  <Button
                    compact
                    variant="secondary"
                    label={t.createSpot.add}
                    onPress={addTagFromInput}
                    loading={addingTag}
                    disabled={!tagInput.trim()}
                  />
                </View>

                {tagSuggestions.length > 0 && (
                  <View style={formStyles.chipRow}>
                    {tagSuggestions.map((tag) => (
                      <Chip key={tag.id} label={tag.name} onPress={() => addTag(tag)} />
                    ))}
                  </View>
                )}
              </>
            )}
          </FormField>
        </FormSection>
      </ScrollView>

      {/* 入力項目が多く縦に長い画面のため、送信ボタンは画面下に固定してスクロールせずに押せるようにする */}
      <FormFooter>
        <Button label={t.createSpot.save} onPress={submit} loading={submitting} />
      </FormFooter>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  accessInput: { minHeight: 80 },
  locationRow: { flexDirection: 'row', gap: space.s },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coordsText: { color: colors.textSecondary, fontSize: type.small },
  embedItem: { gap: space.s, marginBottom: space.s },
  embedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    paddingVertical: 10,
    paddingHorizontal: space.m,
  },
  embedPlatformTag: {
    color: colors.textSecondary,
    fontSize: type.caption,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.s,
    paddingVertical: 2,
  },
  embedUrlText: { flex: 1, color: colors.textSecondary, fontSize: type.small },
  embedPreviewBox: { borderRadius: radius.m, overflow: 'hidden', backgroundColor: colors.background },
});
