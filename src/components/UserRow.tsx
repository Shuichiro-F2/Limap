// フォロー一覧・ブロック一覧などで使う、ユーザー1人分の行。
// 表示名があれば大きく出し、ユーザーIDは下に小さく添える（プロフィール画面のヘッダーと同じ）。
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Avatar from './Avatar';
import Text from './AppText';
import UserBadge from './UserBadge';
import { colors, space, type } from '../lib/theme';
import type { Profile } from '../types/database';

type Props = {
  user: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'badge'> | null | undefined;
  onPress?: () => void;
  // 右端に置くボタンなど（例: ブロック解除）
  right?: React.ReactNode;
  divider?: boolean;
};

export default function UserRow({ user, onPress, right, divider }: Props) {
  // 表示名が無いときはユーザーIDだけを1回出す（同じ文字が2行続かないように）
  const mainName = user?.display_name || (user?.username ? `@${user.username}` : '');
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Pressable style={styles.main} onPress={onPress} disabled={!onPress}>
        <Avatar url={user?.avatar_url} name={mainName} size={44} />
        <View style={styles.names}>
          <View style={styles.nameRow}>
            <Text style={styles.mainName} numberOfLines={1}>
              {mainName}
            </Text>
            <UserBadge badge={user?.badge} size={14} />
          </View>
          {!!user?.display_name && !!user?.username && (
            <Text style={styles.username} numberOfLines={1}>
              @{user.username}
            </Text>
          )}
        </View>
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space.m },
  names: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mainName: { flexShrink: 1, color: colors.textPrimary, fontSize: type.body },
  username: { color: colors.textMuted, fontSize: 12 },
});
