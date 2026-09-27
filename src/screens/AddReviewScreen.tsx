import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import InstagramEmbed from '../components/InstagramEmbed';
import XEmbed from '../components/XEmbed';
import { supabase } from '../lib/supabase';
import { fetchSpotBySlug, spotThumbnailUrl } from '../lib/spots';
import { createSpotReview } from '../lib/spotReviews';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import PhotoEditList, { movePhoto } from '../components/PhotoEditList';
import { detectEmbedUrl, MAX_SNS_EMBEDS, type DetectedEmbed } from '../lib/embeds';
import { takeReviewDraft } from '../lib/reviewDraft';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/notify';
import { colors, radius, space, type } from '../lib/theme';
import { Button, ChoiceRow, FormField, FormFooter, FormInput, FormScreen, FormSection, formStyles } from '../components/Form';
import { spotRawTitle } from '../content/spotSeo';
import type { VisitTime, Spot } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_PHOTOS = 5;
const VISIT_TIME_OPTIONS: VisitTime[] = ['morning', 'daytime', 'dusk', 'night'];

function fmt(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

type Props = RootStackScreenProps<'AddReview'>;

export default function AddReviewScreen({ navigation, route }: Props) {
  const { spotId } = route.params;
  const { session } = useAuth();
  const t = useTranslation();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [loadingSpot, setLoadingSpot] = useState(true);

  const [description, setDescription] = useState('');
  const [visitTime, setVisitTime] = useState<VisitTime | null>(null);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [embeds, setEmbeds] = useState<DetectedEmbed[]>([]);
  const [embedInput, setEmbedInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: t.addReview.headerTitle });
  }, [t.addReview.headerTitle]);

  useEffect(() => {
    if (!session?.user) {
      navigation.replace('Auth');
    }
  }, [session?.user]);

  useEffect(() => {
    fetchSpotBySlug(spotId)
      .then(setSpot)
      .catch((e) => {
        console.warn('スポット取得エラー', e);
        notify(t.addReview.spotLoadFailedTitle);
      })
      .finally(() => setLoadingSpot(false));
  }, [spotId]);

  // CreateSpotScreenで「近くに似た投稿があります」から遷移してきた場合、
  // それまで入力していた内容を一度だけ引き継ぐ
  useEffect(() => {
    const draft = takeReviewDraft();
    if (draft) {
      setDescription(draft.description);
      setVisitTime(draft.visitTime);
      setImages(draft.images);
      setEmbeds(draft.embeds);
    }
  }, []);

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
      selectionLimit: MAX_PHOTOS,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, MAX_PHOTOS));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => movePhoto(prev, index, direction));
  };

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

  const submit = async () => {
    if (!session?.user) {
      notify(t.createSpot.loginRequiredTitle);
      return;
    }
    if (!spot) return;

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

    // 写真・SNS埋め込み・コメントのいずれも空の投稿は意味がないため防ぐ
    if (images.length === 0 && finalEmbeds.length === 0 && !description.trim()) {
      notify(t.addReview.contentRequiredTitle);
      return;
    }

    setSubmitting(true);
    try {
      const imagePaths: { path: string; thumbnailPath: string | null }[] = [];
      for (const asset of images) {
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

        imagePaths.push({ path: fullPath, thumbnailPath });
      }

      await createSpotReview(session.user.id, spot.id, {
        description: description.trim() || undefined,
        recommendedVisitTime: visitTime ?? undefined,
        imagePaths,
        embedUrls: finalEmbeds.map((e) => e.url),
      });

      notify(t.addReview.submitSuccessTitle, '', () => navigation.replace('SpotDetail', { spotId: spot.slug }));
    } catch (e: any) {
      notify(t.addReview.submitFailedTitle, e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpot) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.spotLoadFailedText}>{t.addReview.spotLoadFailedTitle}</Text>
      </View>
    );
  }

  const thumb = spotThumbnailUrl(spot);

  return (
    <FormScreen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* どのスポットへの投稿かが一目で分かるよう、写真付きの小さなカードで示す */}
        <View style={styles.spotCard}>
          {thumb ? <Image source={{ uri: thumb }} style={styles.spotThumb} /> : <View style={styles.spotThumb} />}
          <View style={styles.spotCardBody}>
            <Text style={styles.spotCardLabel}>{t.addReview.targetLabel}</Text>
            <Text variant="body" style={styles.spotCardTitle} numberOfLines={2}>
              {spotRawTitle(spot)}
            </Text>
          </View>
        </View>

        <FormSection first title={t.createSpot.sectionMedia} note={t.createSpot.mediaRequiredNote}>
          <FormField label={t.createSpot.photos} help={fmt(t.createSpot.photosHelp, MAX_PHOTOS)}>
            <Button variant="secondary" icon="images-outline" label={t.createSpot.pickPhotos} onPress={pickImages} />
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

        <FormSection title={t.createSpot.sectionMore}>
          <FormField label={t.addReview.comment} help={t.addReview.commentHelp}>
            <FormInput
              value={description}
              onChangeText={setDescription}
              placeholder={t.addReview.commentPlaceholder}
              multiline
            />
          </FormField>

          <FormField label={t.createSpot.visitTime} help={t.createSpot.visitTimeHelp}>
            <ChoiceRow
              options={VISIT_TIME_OPTIONS.map((opt) => ({ value: opt, label: visitTimeLabel(opt) }))}
              value={visitTime}
              onChange={setVisitTime}
              allowDeselect
            />
          </FormField>
        </FormSection>
      </ScrollView>

      <FormFooter>
        <Button label={t.addReview.submit} onPress={submit} loading={submitting} />
      </FormFooter>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  spotLoadFailedText: { color: colors.textSecondary, fontSize: 14 },
  flex: { flex: 1 },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    padding: space.m,
    marginBottom: 36,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spotThumb: { width: 56, height: 56, borderRadius: radius.s, backgroundColor: colors.surfaceAlt },
  spotCardBody: { flex: 1, minWidth: 0, gap: space.xs },
  spotCardLabel: { color: colors.accent, fontSize: type.caption },
  spotCardTitle: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
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
