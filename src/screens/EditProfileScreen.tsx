import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { updateProfile, uploadAvatar } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

const BIO_MAX = 200;

type Props = RootStackScreenProps<'EditProfile'>;

// ユーザーID(username)とは別に、表示名・自己紹介文・プロフィール画像を編集する画面。
// usernameそのものは他の場所（共有URLなど）から広く参照されるため、ここでは編集対象にしない。
export default function EditProfileScreen({ navigation }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('写真ライブラリへのアクセス許可が必要です');
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
      notify('保存に失敗しました', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
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
      <Text style={styles.avatarHint}>タップして画像を変更</Text>

      <Text style={styles.label}>表示名</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="表示名を入力（未設定でも可）"
        placeholderTextColor="#666"
        maxLength={40}
      />

      <Text style={styles.label}>自己紹介</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
        placeholder="自己紹介文を入力（未設定でも可）"
        placeholderTextColor="#666"
        multiline
      />
      <Text style={styles.bioCounter}>
        {bio.length} / {BIO_MAX}
      </Text>

      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.saveButtonText}>保存する</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, alignItems: 'center' },
  avatarWrap: { marginTop: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { color: colors.accentText, fontSize: 32, fontWeight: '700' },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: { color: colors.textMuted, fontSize: 11, marginTop: 8, marginBottom: 24 },
  label: { color: colors.textSecondary, fontSize: 12, alignSelf: 'flex-start', marginBottom: 6, marginTop: 12 },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 10 },
  bioCounter: { color: colors.textMuted, fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  saveButton: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
});
