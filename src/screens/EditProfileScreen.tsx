import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { Button, FormField, FormInput, formStyles } from '../components/Form';
import { updateProfile, uploadAvatar } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

const BIO_MAX = 200;

type Props = RootStackScreenProps<'EditProfile'>;

// ユーザーID(username)とは別に、表示名・自己紹介文・プロフィール画像を編集する画面。
// usernameそのものは他の場所（共有URLなど）から広く参照されるため、ここでは編集対象にしない。
export default function EditProfileScreen({ navigation }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const t = useTranslation().editProfile;
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify(t.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedAsset(asset);
      setAvatarUrl(asset.uri);
    }
  };

  const save = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      let nextAvatarUrl = profile?.avatar_url ?? null;
      if (pickedAsset?.base64) {
        nextAvatarUrl = await uploadAvatar(session.user.id, pickedAsset.uri, pickedAsset.base64);
      }
      await updateProfile(session.user.id, {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: nextAvatarUrl,
      });
      await refreshProfile();
      navigation.goBack();
    } catch (e: any) {
      notify(t.saveFailedTitle, e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarBlock}>
        <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel={t.changePhoto}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {(profile?.username ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera-outline" size={16} color={colors.accentText} />
          </View>
        </Pressable>
        <Text variant="body" style={styles.avatarHint}>
          {t.changePhoto}
        </Text>
      </View>

      <View style={styles.fields}>
        <FormField label={t.displayName}>
          <FormInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t.displayNamePlaceholder}
            maxLength={40}
          />
        </FormField>

        <FormField label={t.bio}>
          <FormInput
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, BIO_MAX))}
            placeholder={t.bioPlaceholder}
            multiline
          />
          <Text variant="body" style={[formStyles.caption, styles.counter]}>
            {bio.length} / {BIO_MAX}
          </Text>
        </FormField>
      </View>

      <Button label={t.save} onPress={save} loading={saving} style={styles.saveButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarBlock: { alignItems: 'center', gap: 10, marginBottom: space.xxl },
  avatar: { width: 104, height: 104, borderRadius: radius.pill },
  // 画像未設定のときは、控えめな面にイニシャルを置く（黄色一色だと画面の中で目立ちすぎるため）
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { color: colors.accent, fontSize: 40 },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarHint: { color: colors.textMuted, fontSize: 12 },
  fields: { gap: 20 },
  counter: { alignSelf: 'flex-end', marginTop: -4 },
  saveButton: { marginTop: space.xxl },
});
