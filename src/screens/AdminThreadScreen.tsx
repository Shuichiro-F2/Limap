import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { UsernameWithBadge } from '../components/UserBadge';
import ContactThreadView from '../components/ContactThreadView';
import { fetchThreadById, fetchThreadMessages, sendContactMessage, setThreadStatus } from '../lib/contact';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { ContactThread, ContactMessage } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'AdminThread'>;

// 運営(is_admin)専用の問い合わせ詳細・返信画面。
export default function AdminThreadScreen({ route, navigation }: Props) {
  const { threadId } = route.params;
  const { session, isAdmin } = useAuth();
  const [thread, setThread] = useState<ContactThread | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, msgs] = await Promise.all([fetchThreadById(threadId), fetchThreadMessages(threadId)]);
      setThread(t);
      setMessages(msgs);
      navigation.setOptions({
        title: t.user?.username ? `@${t.user.username}` : 'お問い合わせ',
      });
    } catch (e) {
      console.warn('スレッド取得エラー', e);
    } finally {
      setLoading(false);
    }
  }, [threadId, navigation]);

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

  const sendReply = async (body: string) => {
    if (!session?.user) return;
    setSending(true);
    try {
      await sendContactMessage(threadId, session.user.id, true, body);
      setMessages(await fetchThreadMessages(threadId));
    } catch (e: any) {
      notify('送信に失敗しました', e.message);
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!thread) return;
    const next = thread.status === 'open' ? 'closed' : 'open';
    setStatusBusy(true);
    try {
      await setThreadStatus(threadId, next);
      setThread({ ...thread, status: next });
    } catch (e: any) {
      notify('更新に失敗しました', e.message);
    } finally {
      setStatusBusy(false);
    }
  };

  if (!isAdmin) {
    return <View style={styles.container} />;
  }

  if (loading || !thread) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <UsernameWithBadge username={thread.user?.username} badge={thread.user?.badge} textStyle={styles.username} />
        <Pressable style={styles.statusButton} onPress={toggleStatus} disabled={statusBusy}>
          <Text style={styles.statusButtonText}>
            {thread.status === 'open' ? '対応完了にする' : '対応中に戻す'}
          </Text>
        </Pressable>
      </View>
      <ContactThreadView
        messages={messages}
        currentUserId={session?.user?.id}
        sending={sending}
        onSend={sendReply}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  username: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  statusButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusButtonText: { color: colors.textSecondary, fontSize: 12 },
});
