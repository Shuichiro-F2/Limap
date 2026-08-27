import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { UsernameWithBadge } from '../components/UserBadge';
import { fetchAllThreads } from '../lib/contact';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { ContactThread, ContactCategory } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  bug: '不具合の報告',
  request: 'ご要望・ご意見',
  other: 'その他',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

type Props = RootStackScreenProps<'AdminInbox'>;

// 運営(is_admin)専用の問い合わせ一覧。すべてのユーザーのスレッドを
// 直近の動きがあった順に表示する。アクセス制御はRLS側でも行っているが、
// 画面側でもis_adminでない場合は空表示にしておく。
export default function AdminInboxScreen({ navigation }: Props) {
  const { isAdmin } = useAuth();
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllThreads();
      setThreads(data);
    } catch (e) {
      console.warn('問い合わせ一覧取得エラー', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load();
    }, [isAdmin, load])
  );

  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin, navigation]);

  if (!isAdmin) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.emptyText}>問い合わせはまだありません</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('AdminThread', { threadId: item.id })}
            >
              {item.user?.avatar_url ? (
                <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {(item.user?.username ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.rowHeader}>
                  <UsernameWithBadge
                    username={item.user?.username}
                    badge={item.user?.badge}
                    textStyle={styles.username}
                  />
                  <View style={[styles.statusBadge, item.status === 'open' ? styles.statusOpen : styles.statusClosed]}>
                    <Text style={item.status === 'open' ? styles.statusTextOpen : styles.statusTextClosed}>
                      {item.status === 'open' ? '対応中' : '対応完了'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.category}>{CATEGORY_LABELS[item.category]}</Text>
                <Text style={styles.date}>{formatDate(item.updated_at)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  username: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  category: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusOpen: { backgroundColor: colors.accent },
  statusClosed: { backgroundColor: colors.surface },
  statusTextOpen: { color: colors.accentText, fontSize: 10, fontWeight: '600' },
  statusTextClosed: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
});
