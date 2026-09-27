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
import ProfileHeader from '../components/ProfileHeader';
import { Button } from '../components/Form';
import { fetchPublishedSpotsByAuthor, spotThumbnailUrl } from '../lib/spots';
import { fetchProfileById, fetchFollowCounts, isFollowing, toggleFollow, type FollowCounts } from '../lib/profiles';
import { blockUser, unblockUser, reportUser } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Spot, Profile, ReportReason } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

// 通報理由の表示順。ラベルは i18n の profile.reportReasons
const REPORT_REASONS: ReportReason[] = ['inappropriate', 'spam', 'privacy', 'other'];

type Props = RootStackScreenProps<'UserProfile'>;

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { session, blockedUserIds, refreshBlockedUserIds } = useAuth();
  const t = useTranslation();
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
      notify(t.profile.errorTitle, e.message ?? t.profile.genericError);
    } finally {
      setBlockBusy(false);
    }
  };

  const handleReport = async (reason: ReportReason) => {
    if (!session?.user) {
      notify(t.spotDetail.loginRequiredTitle);
      return;
    }
    try {
      await reportUser(session.user.id, userId, reason);
      setShowReport(false);
      notify(t.spotDetail.reportReceivedTitle, t.spotDetail.reportReceivedMessage);
    } catch (e: any) {
      notify(t.profile.errorTitle, e.message ?? t.profile.genericError);
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
      <ProfileHeader
        profile={profile}
        posts={spots.length}
        followers={counts.followers}
        following={counts.following}
        onPressFollowers={() => navigation.push('FollowList', { userId, mode: 'followers' })}
        onPressFollowing={() => navigation.push('FollowList', { userId, mode: 'following' })}
      >
        {!isOwnProfile && session?.user && (
          <View style={styles.actionRow}>
            <Button
              compact
              style={styles.followButton}
              variant={following ? 'secondary' : 'primary'}
              label={following ? t.profile.followingState : t.profile.follow}
              onPress={handleToggleFollow}
              disabled={followBusy}
            />
            <Pressable
              style={styles.menuButton}
              onPress={() => setShowMenu((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.profile.moreActions}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        )}

        {!isOwnProfile && showMenu && (
          <View style={styles.menuPanel}>
            <Pressable style={styles.menuItem} onPress={handleToggleBlock} disabled={blockBusy}>
              <Ionicons name="ban-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>{isBlocked ? t.profile.unblock : t.profile.block}</Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => {
                setShowMenu(false);
                setShowReport(true);
              }}
            >
              <Ionicons name="flag-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>{t.profile.report}</Text>
            </Pressable>
          </View>
        )}

        {!isOwnProfile && showReport && (
          <View style={styles.reportPanel}>
            <Text style={styles.reportTitle}>{t.profile.reportTitle}</Text>
            {REPORT_REASONS.map((reason) => (
              <Pressable key={reason} style={styles.reportOption} onPress={() => handleReport(reason)}>
                <Text variant="body" style={styles.reportOptionText}>
                  {t.profile.reportReasons[reason as keyof typeof t.profile.reportReasons]}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.reportCancel} onPress={() => setShowReport(false)}>
              <Text style={styles.reportCancelText}>{t.profile.cancel}</Text>
            </Pressable>
          </View>
        )}
      </ProfileHeader>

      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 4 }}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <Text variant="body" style={styles.emptyText}>
            {t.profile.empty}
          </Text>
        }
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
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  followButton: { flex: 1 },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: space.l,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { color: colors.textPrimary, fontSize: 14 },
  menuItemDanger: { color: colors.danger },
  reportPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.l,
  },
  reportTitle: { color: colors.textPrimary, fontSize: 14, marginBottom: space.s },
  reportOption: { paddingVertical: 10 },
  reportOptionText: { color: colors.textSecondary, fontSize: 14 },
  reportCancel: { marginTop: 6, alignItems: 'center', paddingVertical: space.s },
  reportCancelText: { color: colors.textMuted, fontSize: type.small },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 6, backgroundColor: colors.surface },
  noImage: { backgroundColor: colors.surface },
});
