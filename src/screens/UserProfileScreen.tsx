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
import { UsernameWithBadge } from '../components/UserBadge';
import { fetchPublishedSpotsByAuthor, spotThumbnailUrl } from '../lib/spots';
import { fetchProfileById, fetchFollowCounts, isFollowing, toggleFollow, type FollowCounts } from '../lib/profiles';
import { blockUser, unblockUser, reportUser } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Spot, Profile, ReportReason } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate', label: '不適切なコンテンツ・迷惑行為' },
  { value: 'spam', label: 'スパム・宣伝アカウント' },
  { value: 'privacy', label: 'なりすまし・プライバシーの懸念' },
  { value: 'other', label: 'その他' },
];

type Props = RootStackScreenProps<'UserProfile'>;

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { session, blockedUserIds, refreshBlockedUserIds } = useAuth();
  const isOwnProfile = session?.user?.id === userId;
  const isBlocked = blockedUserIds.has(userId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

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

  const handleToggleBlock = async () => {
    if (!session?.user) return;
    setBlockBusy(true);
    try {
      if (isBlocked) {
        await unblockUser(session.user.id, userId);
      } else {
        await blockUser(session.user.id, userId);
        // ブロックしたら自分自身のフォロー状態も意味をなさなくなるため見た目上も解除しておく
        setFollowing(false);
      }
      await refreshBlockedUserIds();
      setShowMenu(false);
    } catch (e: any) {
      notify('エラー', e.message ?? '処理に失敗しました');
    } finally {
      setBlockBusy(false);
    }
  };

  const handleReport = async (reason: ReportReason) => {
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    try {
      await reportUser(session.user.id, userId, reason);
      setShowReport(false);
      notify('通報を受け付けました', 'ご協力ありがとうございます。');
    } catch (e: any) {
      notify('エラー', e.message ?? '処理に失敗しました');
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
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{(profile?.username ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <UsernameWithBadge username={profile?.username} badge={profile?.badge} textStyle={styles.username} />
          {profile?.display_name && <Text style={styles.displayName}>{profile.display_name}</Text>}
        </View>
      </View>

      {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{spots.length}</Text>
          <Text style={styles.countLabel}>投稿</Text>
        </View>
        <Pressable style={styles.countItem} onPress={() => navigation.push('FollowList', { userId, mode: 'followers' })}>
          <Text style={styles.countNumber}>{counts.followers}</Text>
          <Text style={styles.countLabel}>フォロワー</Text>
        </Pressable>
        <Pressable style={styles.countItem} onPress={() => navigation.push('FollowList', { userId, mode: 'following' })}>
          <Text style={styles.countNumber}>{counts.following}</Text>
          <Text style={styles.countLabel}>フォロー中</Text>
        </Pressable>
      </View>

      {!isOwnProfile && session?.user && (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.followButton, following && styles.followButtonActive]}
            onPress={handleToggleFollow}
            disabled={followBusy}
          >
            <Text style={[styles.followButtonText, following && styles.followButtonTextActive]}>
              {following ? 'フォロー中' : 'フォローする'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.menuButton}
            onPress={() => setShowMenu((v) => !v)}
            hitSlop={8}
            accessibilityLabel="その他の操作"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {!isOwnProfile && showMenu && (
        <View style={styles.menuPanel}>
          <Pressable
            style={styles.menuItem}
            onPress={handleToggleBlock}
            disabled={blockBusy}
          >
            <Text style={styles.menuItemText}>{isBlocked ? 'ブロックを解除する' : 'ブロックする'}</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              setShowReport(true);
            }}
          >
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>通報する</Text>
          </Pressable>
        </View>
      )}

      {!isOwnProfile && showReport && (
        <View style={styles.reportPanel}>
          <Text style={styles.reportTitle}>通報理由を選択してください</Text>
          {REPORT_REASONS.map((r) => (
            <Pressable key={r.value} style={styles.reportOption} onPress={() => handleReport(r.value)}>
              <Text style={styles.reportOptionText}>{r.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.reportCancel} onPress={() => setShowReport(false)}>
            <Text style={styles.reportCancelText}>キャンセル</Text>
          </Pressable>
        </View>
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
            {spotThumbnailUrl(item) ? (
              <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.gridImage} />
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
  },
  avatarPlaceholder: {
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
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followButtonActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  followButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 14 },
  followButtonTextActive: { color: colors.textPrimary },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, gap: 8 },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { color: colors.textPrimary, fontSize: 14 },
  menuItemDanger: { color: '#e05a5a' },
  reportPanel: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
  },
  reportTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  reportOption: { paddingVertical: 10 },
  reportOptionText: { color: colors.textSecondary, fontSize: 13 },
  reportCancel: { marginTop: 6, alignItems: 'center', paddingVertical: 8 },
  reportCancelText: { color: colors.textMuted, fontSize: 13 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 4 },
  noImage: { backgroundColor: colors.surface },
});
