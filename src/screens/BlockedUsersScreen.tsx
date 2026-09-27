import React, { useCallback, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import UserRow from '../components/UserRow';
import { Button } from '../components/Form';
import { fetchBlockedUsers, unblockUser } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { useTranslation } from '../lib/i18n';
import { colors, type } from '../lib/theme';
import type { Block } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'BlockedUsers'>;

// マイページから遷移する「ブロック中のユーザー」一覧。各行からブロック解除できる。
export default function BlockedUsersScreen({ navigation }: Props) {
  const { session, refreshBlockedUserIds } = useAuth();
  const t = useTranslation();
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
      notify(t.profile.errorTitle, e.message ?? t.profile.genericError);
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
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="body" style={styles.emptyText}>
              {t.profile.blockedEmpty}
            </Text>
          }
          renderItem={({ item, index }) => (
            <UserRow
              user={item.blocked}
              divider={index > 0}
              onPress={() => item.blocked && navigation.push('UserProfile', { userId: item.blocked.id })}
              right={
                <Button
                  compact
                  variant="secondary"
                  label={t.profile.unblockShort}
                  onPress={() => handleUnblock(item.blocked_id)}
                  loading={busyId === item.blocked_id}
                />
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20, paddingVertical: 8, width: '100%', maxWidth: 640, alignSelf: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
});
