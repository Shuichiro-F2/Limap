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
import { fetchPublishedSpotsByAuthor, spotImageUrl } from '../lib/spots';
import { fetchProfileById, fetchFollowCounts, isFollowing, toggleFollow, type FollowCounts } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { Spot, Profile } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'UserProfile'>;

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { session } = useAuth();
  const isOwnProfile = session?.user?.id === userId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, spotsData, countsData] = await Promise.all([
        fetchProfileById(userId),
        fetchPublishedSpotsByAuthor(userId),
        fetchFollowCounts(userId),
      ]);
      setProfile(profileData);
      setSpots(spotsData);
      setCounts(countsData);
      navigation.setOptions({ title: profileData.username ? `@${profileData.username}` : '' });

      if (session?.user && !isOwnProfile) {
        isFollowing(session.user.id, userId)
          .then(setFollowing)
          .catch(() => {});
      }
    } catch (e) {
      console.warn('プロフィール取得エラー', e);
    } finally {
      setLoading(false);
    }
  }, [userId, session?.user?.id, isOwnProfile]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleFollow = async () => {
    if (!session?.user) return;
    const next = !following;
    setFollowing(next);
    setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    setFollowBusy(true);
    try {
      await toggleFollow(session.user.id, userId, !next);
    } catch (e) {
      // 失敗時はロールバック
      setFollowing(!next);
      setCounts((c) => ({ ...c, followers: c.followers + (next ? -1 : 1) }));
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.username ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          {profile?.display_name && <Text style={styles.displayName}>{profile.display_name}</Text>}
        </View>
      </View>

      {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{spots.length}</Text>
          <Text style={styles.countLabel}>投稿</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{counts.followers}</Text>
          <Text style={styles.countLabel}>フォロワー</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{counts.following}</Text>
          <Text style={styles.countLabel}>フォロー中</Text>
        </View>
      </View>

      {!isOwnProfile && session?.user && (
        <Pressable
          style={[styles.followButton, following && styles.followButtonActive]}
          onPress={handleToggleFollow}
          disabled={followBusy}
        >
          <Text style={[styles.followButtonText, following && styles.followButtonTextActive]}>
            {following ? 'フォロー中' : 'フォローする'}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 4, paddingTop: 16 }}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={<Text style={styles.emptyText}>まだ投稿がありません</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
          >
            {item.images && item.images.length > 0 ? (
              <Image source={{ uri: spotImageUrl(item.images[0].storage_path) }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridImage, styles.noImage]} />
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
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
  bio: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20, lineHeight: 19 },
  countsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 28 },
  countItem: { alignItems: 'center' },
  countNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  countLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  followButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followButtonActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  followButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 14 },
  followButtonTextActive: { color: colors.textPrimary },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 4 },
  noImage: { backgroundColor: colors.surface },
});
