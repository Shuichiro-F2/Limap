import React, { useCallback, useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { UsernameWithBadge } from '../components/UserBadge';
import { fetchBlockedUsers, unblockUser } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { Block } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'BlockedUsers'>;

// マイページから遷移する「ブロック中のユーザー」一覧。各行からブロック解除できる。
export default function BlockedUsersScreen({ navigation }: Props) {
  const { session, refreshBlockedUserIds } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) {
      setBlocks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchBlockedUsers(session.user.id);
      setBlocks(data);
    } catch (e) {
      console.warn('ブロック一覧取得エラー', e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUnblock = async (blockedId: string) => {
    if (!session?.user) return;
    setBusyId(blockedId);
    try {
      await unblockUser(session.user.id, blockedId);
      setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      await refreshBlockedUserIds();
    } catch (e: any) {
      notify('エラー', e.message ?? '処理に失敗しました');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.emptyText}>ブロック中のユーザーはいません</Text>}
          renderItem={({ item }) => {
            const user = item.blocked;
            return (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => user && navigation.push('UserProfile', { userId: user.id })}
                >
                  {user?.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderText}>
                        {(user?.username ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <UsernameWithBadge username={user?.username} badge={user?.badge} textStyle={styles.username} />
                    {user?.display_name ? <Text style={styles.displayName}>{user.display_name}</Text> : null}
                  </View>
                </Pressable>
                <Pressable
                  style={styles.unblockButton}
                  onPress={() => handleUnblock(item.blocked_id)}
                  disabled={busyId === item.blocked_id}
                >
                  <Text style={styles.unblockButtonText}>解除</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 8 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  username: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  displayName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  unblockButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unblockButtonText: { color: colors.textPrimary, fontSize: 12 },
});
