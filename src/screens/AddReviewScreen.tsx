import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import InstagramEmbed from '../components/InstagramEmbed';
import XEmbed from '../components/XEmbed';
import { supabase } from '../lib/supabase';
import { fetchSpotBySlug } from '../lib/spots';
import { createSpotReview } from '../lib/spotReviews';
import { resizeImageForUpload, extensionForContentType, THUMBNAIL_RESIZE_OPTIONS } from '../lib/imageResize';
import { detectEmbedUrl, MAX_SNS_EMBEDS, type DetectedEmbed } from '../lib/embeds';
import { takeReviewDraft } from '../lib/reviewDraft';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.lead}>{t.addReview.leadTemplate.replace('{name}', spot.title)}</Text>

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

      <SectionLabel label={t.createSpot.photos} help={fmt(t.createSpot.photosHelp, MAX_PHOTOS)} />
      <Pressable style={styles.secondaryButton} onPress={pickImages}>
        <Text style={styles.secondaryButtonText}>{t.createSpot.pickPhotos}</Text>
      </Pressable>
      <ScrollView horizontal style={{ marginTop: 12 }}>
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img.uri }} style={styles.thumb} />
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

      <SectionLabel label={t.addReview.comment} help={t.addReview.commentHelp} />
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t.addReview.commentPlaceholder}
        placeholderTextColor="#666"
        multiline
      />

      <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.submitButtonText}>{t.addReview.submit}</Text>
        )}
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  centerContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  spotLoadFailedText: { color: colors.textSecondary, fontSize: 14 },
  lead: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8 },
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
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  secondaryButton: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 14 },
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
