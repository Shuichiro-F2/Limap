// マイページと、ほかのユーザーのプロフィール画面で共通のヘッダー
// （プロフィール画像・名前・自己紹介・投稿/フォロワー/フォロー中の数）。
// ボタン（プロフィール編集・フォローなど）は children として下に置く。
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Avatar from './Avatar';
import Text from './AppText';
import UserBadge from './UserBadge';
import { useTranslation } from '../lib/i18n';
import { colors, space, type } from '../lib/theme';
import type { Profile } from '../types/database';

type Props = {
  profile: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'bio' | 'badge'> | null | undefined;
  posts: number;
  followers: number;
  following: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  children?: React.ReactNode;
};

export default function ProfileHeader({
  profile,
  posts,
  followers,
  following,
  onPressFollowers,
  onPressFollowing,
  children,
}: Props) {
  const t = useTranslation();
  // 表示名があれば大きく出し、ユーザーIDは下に小さく添える
  // 表示名が無いときはユーザーIDだけを1回出す（同じ文字が2行続かないように）
  const mainName = profile?.display_name || (profile?.username ? `@${profile.username}` : '');
  const stats = [
    { label: t.profile.posts, value: posts },
    { label: t.myPage.followers, value: followers, onPress: onPressFollowers },
    { label: t.myPage.following, value: following, onPress: onPressFollowing },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Avatar url={profile?.avatar_url} name={mainName} size={72} />
        <View style={styles.names}>
          <View style={styles.nameRow}>
            <Text style={styles.mainName} numberOfLines={1}>
              {mainName}
            </Text>
            <UserBadge badge={profile?.badge} size={16} />
          </View>
          {!!profile?.display_name && !!profile?.username && (
            <Text style={styles.username} numberOfLines={1}>
              @{profile.username}
            </Text>
          )}
        </View>
      </View>

      {!!profile?.bio && (
        <Text variant="body" style={styles.bio}>
          {profile.bio}
        </Text>
      )}

      <View style={styles.stats}>
        {stats.map((stat) => (
          <Pressable key={stat.label} style={styles.stat} onPress={stat.onPress} disabled={!stat.onPress}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Pressable>
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: space.m, paddingBottom: space.l, gap: space.l },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.l },
  names: { flex: 1, minWidth: 0, gap: space.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mainName: { flexShrink: 1, color: colors.textPrimary, fontSize: 20 },
  username: { color: colors.textMuted, fontSize: type.small },
  bio: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: space.m,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: colors.textPrimary, fontSize: type.heading },
  statLabel: { color: colors.textMuted, fontSize: type.caption },
});
