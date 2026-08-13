import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { fetchSpotsByAuthor, fetchLikedSpots, fetchBookmarkedSpots, spotImageUrl } from '../lib/spots';
import { fetchFollowCounts, type FollowCounts } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'MyPageTab'>;

type TabKey = 'mine' | 'liked' | 'bookmarked';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'mine', label: '自分の投稿' },
  { key: 'liked', label: 'いいね' },
  { key: 'bookmarked', label: '行きたい場所' },
];

export default function MyPageScreen({ navigation }: Props) {
  const { profile, session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('mine');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      let data: Spot[] = [];
      if (activeTab === 'mine') data = await fetchSpotsByAuthor(session.user.id);
      else if (activeTab === 'liked') data = await fetchLikedSpots(session.user.id);
      else data = await fetchBookmarkedSpots(session.user.id);
      setSpots(data);
    } catch (e) {
      console.warn('マイページ取得エラー', e);
      // 取得失敗時に前のタブのデータが残り続けないよう、必ず空にする
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, session?.user?.id]);

  // タブ切り替え時に再取得。画面に戻ってきたときも最新化する
  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!session?.user) return;
    fetchFollowCounts(session.user.id)
      .then(setFollowCounts)
      .catch((e) => console.warn('フォロー数取得エラー', e));
  }, [session?.user?.id]);

  // 未ログイン時はプロフィールの代わりにログイン導線を表示する（閲覧自体はログイン不要）
  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.loggedOutBox}>
          <Text style={styles.loggedOutTitle}>ログインするとマイページが使えます</Text>
          <Text style={styles.loggedOutText}>
            投稿・いいね・行きたい場所の保存・フォローには{'\n'}アカウントが必要です。
          </Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.logoRow}>
        <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.username ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          {profile?.display_name && <Text style={styles.displayName}>{profile.display_name}</Text>}
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </Pressable>
      </View>

      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{followCounts.followers}</Text>
          <Text style={styles.countLabel}>フォロワー</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{followCounts.following}</Text>
          <Text style={styles.countLabel}>フォロー中</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 4 }}
          ListEmptyComponent={<Text style={styles.emptyText}>まだ表示できるスポットがありません</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.gridItem}
              onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
            >
              {item.images && item.images.length > 0 ? (
                <Image source={{ uri: spotImageUrl(item.images[0].storage_path) }} style={styles.gridImage} />
              ) : (
                <View style={[styles.gridImage, styles.noImage]}>
                  <Text style={styles.noImageText} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  logoRow: { paddingLeft: 20, paddingTop: 12 },
  logo: { width: 84, height: 52 },
  loggedOutBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  loggedOutText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  loginButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentText, fontSize: 18, fontWeight: '700' },
  username: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  displayName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  logoutText: { color: colors.textSecondary, fontSize: 12 },
  countsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 28, marginBottom: 16 },
  countItem: { alignItems: 'center' },
  countNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  countLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: colors.accent },
  tabButtonText: { color: colors.textSecondary, fontSize: 12 },
  tabButtonTextActive: { color: colors.accentText, fontWeight: '600' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 4 },
  noImage: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 6 },
  noImageText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
