import React, { useEffect, useRef, useState } from 'react';
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
import { createSpot, findNearbySpots, MAX_TAGS_PER_SPOT, type NearbySpotMatch } from '../lib/spots';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import PhotoEditList, { movePhoto } from '../components/PhotoEditList';
import { fetchAllTags, findOrCreateTag } from '../lib/tags';
import { detectEmbedUrl, MAX_SNS_EMBEDS, type DetectedEmbed } from '../lib/embeds';
import { isValidHttpUrl } from '../lib/url';
import { locationFromAssets } from '../lib/photoLocation';
import { saveCreateSpotDraft, takeCreateSpotDraft } from '../lib/createSpotDraft';
import { saveReviewDraft } from '../lib/reviewDraft';
import DuplicateSpotPopup from '../components/DuplicateSpotPopup';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/notify';
import { colors, radius, space, type } from '../lib/theme';
import { Button, ChoiceRow, Chip, FormField, FormFooter, FormInput, FormScreen, FormSection, formStyles } from '../components/Form';
import type { Tag, VisitTime } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_TAGS = MAX_TAGS_PER_SPOT;
const MAX_PHOTOS = 5;
const VISIT_TIME_OPTIONS: VisitTime[] = ['morning', 'daytime', 'dusk', 'night'];

// 「写真（最大{n}枚）」のような文言の{n}部分を実際の件数に置き換える
function fmt(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

type Props = RootStackScreenProps<'CreateSpot'>;

export default function CreateSpotScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const t = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('');
  const [visitTime, setVisitTime] = useState<VisitTime | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [embeds, setEmbeds] = useState<DetectedEmbed[]>([]);
  const [embedInput, setEmbedInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 座標・名前が近い既存スポットが見つかった場合に案内するポップアップ用の状態。
  // 同じ組み合わせ(座標+タイトル)で一度閉じたら、再入力するまで出しっぱなしに
  // しないよう、直前に閉じた組み合わせをdismissedSignatureRefに覚えておく。
  const [nearbyMatches, setNearbyMatches] = useState<NearbySpotMatch[]>([]);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const dismissedSignatureRef = useRef<string | null>(null);

  const checkForDuplicates = async (lat: number, lng: number, currentTitle: string) => {
    const signature = `${lat.toFixed(5)},${lng.toFixed(5)}|${currentTitle.trim()}`;
    if (dismissedSignatureRef.current === signature) return;
    try {
      const matches = await findNearbySpots(lat, lng, currentTitle);
      if (matches.length > 0) {
        setNearbyMatches(matches);
        setShowDuplicatePopup(true);
      }
    } catch (e) {
      console.warn('近隣スポット検索エラー', e);
    }
  };

  const dismissDuplicatePopup = () => {
    dismissedSignatureRef.current = coords ? `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}|${title.trim()}` : null;
    setShowDuplicatePopup(false);
  };

  // 「レビューとして投稿する」を選んだ場合、それまでの入力内容(タイトル以外)を
  // AddReviewScreenへ引き継いでから遷移する
  const selectDuplicateMatch = (match: NearbySpotMatch) => {
    saveReviewDraft({ description, visitTime, images, embeds });
    setShowDuplicatePopup(false);
    navigation.navigate('AddReview', { spotId: match.slug });
  };

  // ヘッダーのタイトルも選択中の言語に合わせる(このスクリーン自体は
  // 4タブのようにReact Navigationの外側にいる時間が長いため、画面遷移をまたいでも
  // 選択した言語がここでも維持されていることを分かりやすくする)
  useEffect(() => {
    navigation.setOptions({ title: t.createSpot.headerTitle });
  }, [t.createSpot.headerTitle]);

  // 既存タグの候補一覧（新規タグはこの場で追加できる）
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  // URL直接アクセスなど、未ログインでこの画面に来た場合はログイン画面へ誘導する
  useEffect(() => {
    if (!session?.user) {
      // ログイン（または登録）したら、そのままこの画面に戻ってくる
      navigation.replace('Auth', { mode: 'signup', next: 'CreateSpot' });
    }
  }, [session?.user]);

  // LocationPicker画面で選んだ座標をパラメータ経由で受け取る。
  // Web版ではこの往復でCreateSpotScreenが再マウントされ、それまで入力していた
  // タイトルなどが失われてしまうことがあるため、「地図から選択」を押す直前に
  // 退避しておいたフォーム内容(下書き)があればあわせて復元する。
  useEffect(() => {
    const { pickedLat, pickedLng } = route.params ?? {};
    if (pickedLat != null && pickedLng != null) {
      setCoords({ lat: pickedLat, lng: pickedLng });

      const draft = takeCreateSpotDraft();
      if (draft) {
        setTitle(draft.title);
        setDescription(draft.description);
        setAccess(draft.access);
        setVisitTime(draft.visitTime);
        setGoogleMapsUrl(draft.googleMapsUrl);
        setSelectedTags(draft.selectedTags);
        setTagInput(draft.tagInput);
        setImages(draft.images);
        setEmbeds(draft.embeds);
        setEmbedInput(draft.embedInput);
      }
    }
  }, [route.params?.pickedLat, route.params?.pickedLng]);

  // 位置情報が設定/変更されるたびに、近くまたは同じ名前の既存スポットがないか確認する
  useEffect(() => {
    if (coords) checkForDuplicates(coords.lat, coords.lng, title);
  }, [coords?.lat, coords?.lng]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify(t.createSpot.photoPermissionTitle);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      // 撮影場所（GPS）から位置を入れるため。Web では返らないので、元の写真のデータから読む（lib/photoLocation.ts）
      exif: true,
      selectionLimit: MAX_PHOTOS,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, MAX_PHOTOS));
      // 位置がまだ空なら、写真の撮影場所を入れておく（地図や現在地でいつでも直せる）
      if (!coords) {
        const loc = locationFromAssets(result.assets);
        if (loc) {
          setCoords(loc);
          notify(t.createSpot.photoLocationSetTitle, t.createSpot.photoLocationSetMessage);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => movePhoto(prev, index, direction));
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
    if (!session?.user) {
      notify(t.createSpot.loginRequiredTitle);
      return;
    }
    if (!coords) {
      notify(t.createSpot.locationRequiredTitle);
      return;
    }

    // SNS投稿入力欄に文字が残ったまま「追加」を押し忘れて投稿されてしまうケースを防ぐため、
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
    if (images.length === 0 && finalEmbeds.length === 0) {
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

      // スポット名が未入力の場合は、説明文の冒頭から内部用のタイトルを自動生成する
      // （検索やグリッド表示のフォールバックなど、内部的にも使用する）
      const derivedTitle = title.trim() || description.trim().slice(0, 40) || '無題の投稿';

      await createSpot(session.user.id, {
        title: derivedTitle,
        description: description.trim() || undefined,
        access: access.trim() || undefined,
        recommendedVisitTime: visitTime ?? undefined,
        googleMapsUrl: trimmedGoogleMapsUrl || undefined,
        lat: coords.lat,
        lng: coords.lng,
        tagIds: selectedTags.map((tag) => tag.id),
        imagePaths,
        embedUrls: finalEmbeds.map((e) => e.url),
      });

      // 「地図から選択」を経由した場合など、遷移元の画面(位置選択画面)に戻ってしまわないよう、
      // 常にトップページ(地図画面)へ明示的に遷移する
      notify(t.createSpot.submitSuccessTitle, '', () => navigation.navigate('Main', { screen: 'MapTab' }));
    } catch (e: any) {
      notify(t.createSpot.submitFailedTitle, e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* 投稿のハードルを下げるための案内。必須は「場所」と「写真またはSNSの投稿URL」の2つだけで、
            写真が手元に無くても、SNSに投稿した写真のURLで代わりになることを最初に伝える */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>{t.createSpot.guideTitle}</Text>
          <Text variant="body" style={styles.guideBody}>
            {t.createSpot.guideBody}
          </Text>
        </View>

        <FormSection first title={t.createSpot.sectionSpot}>
          <FormField label={t.createSpot.name} help={t.createSpot.nameHelp}>
            <FormInput
              value={title}
              onChangeText={setTitle}
            onEndEditing={() => {
              // 位置情報が既に決まっている状態でタイトルを入力し終えたタイミングでも、
              // 同じ名前の既存スポットがないか確認する
              if (coords) checkForDuplicates(coords.lat, coords.lng, title);
            }}
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
            />
            <PhotoEditList
              items={images.map((img) => ({ uri: img.uri }))}
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
                onPress={() => {
                  // Web版でこの往復中にCreateSpotScreenが再マウントされても入力内容が
                  // 消えないよう、遷移前に現在のフォーム内容を退避しておく
                  saveCreateSpotDraft({
                    title,
                    description,
                    access,
                    visitTime,
                    googleMapsUrl,
                    selectedTags,
                    tagInput,
                    images,
                    embeds,
                    embedInput,
                  });
                  navigation.navigate('LocationPicker', {
                    initialLat: coords?.lat,
                    initialLng: coords?.lng,
                  });
                }}
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
        <Button label={t.createSpot.submit} onPress={submit} loading={submitting} />
      </FormFooter>
      <DuplicateSpotPopup
        visible={showDuplicatePopup}
        matches={nearbyMatches}
        onSelectMatch={selectDuplicateMatch}
        onDismiss={dismissDuplicatePopup}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: space.m,
    marginBottom: space.m,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  guideTitle: { color: colors.textPrimary, fontSize: type.body, marginBottom: 4 },
  guideBody: { color: colors.textSecondary, fontSize: type.small, lineHeight: 20 },
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
