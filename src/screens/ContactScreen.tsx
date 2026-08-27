import React, { useCallback, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import ContactThreadView from '../components/ContactThreadView';
import { fetchMyThread, createThread, fetchThreadMessages, sendContactMessage } from '../lib/contact';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { ContactCategory, ContactThread, ContactMessage } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MESSAGE_MAX = 2000;

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: 'bug', label: '不具合の報告' },
  { value: 'request', label: 'ご要望・ご意見' },
  { value: 'other', label: 'その他' },
];

type Props = RootStackScreenProps<'Contact'>;

// 運営への問い合わせ画面。初回はカテゴリ選択+本文でスレッドを作成し、
// 以降はチャット形式で運営とやり取りできる(運営からの返信もこの画面に届く)。
export default function ContactScreen(_props: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<ContactThread | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [category, setCategory] = useState<ContactCategory>('other');
  const [firstMessage, setFirstMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const t = await fetchMyThread(session.user.id);
      setThread(t);
      if (t) {
        const msgs = await fetchThreadMessages(t.id);
        setMessages(msgs);
      }
    } catch (e) {
      console.warn('問い合わせ取得エラー', e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startThread = async () => {
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    const trimmed = firstMessage.trim();
    if (!trimmed) {
      notify('お問い合わせ内容を入力してください');
      return;
    }
    setSending(true);
    try {
      const t = await createThread(session.user.id, category);
      await sendContactMessage(t.id, session.user.id, false, trimmed);
      setThread(t);
      setMessages(await fetchThreadMessages(t.id));
      setFirstMessage('');
    } catch (e: any) {
      notify('送信に失敗しました', e.message);
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (body: string) => {
    if (!session?.user || !thread) return;
    setSending(true);
    try {
      await sendContactMessage(thread.id, session.user.id, false, body);
      setMessages(await fetchThreadMessages(thread.id));
    } catch (e: any) {
      notify('送信に失敗しました', e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.lead}>
            ご意見・ご要望や不具合の報告など、お気軽にお問い合わせください。内容を確認のうえ、この画面で返信いたします。
          </Text>

          <Text style={styles.label}>カテゴリ</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.categoryOption, category === c.value && styles.categoryOptionSelected]}
                onPress={() => setCategory(c.value)}
              >
                <Text style={category === c.value ? styles.categoryTextSelected : styles.categoryText}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>お問い合わせ内容</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={firstMessage}
            onChangeText={(t) => setFirstMessage(t.slice(0, MESSAGE_MAX))}
            placeholder="内容をご記入ください"
            placeholderTextColor="#666"
            multiline
          />
          <Text style={styles.counter}>
            {firstMessage.length} / {MESSAGE_MAX}
          </Text>

          <Pressable style={styles.submitButton} onPress={startThread} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.submitButtonText}>送信する</Text>
            )}
          </Pressable>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
  form: { padding: 20 },
  lead: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  label: { color: colors.textSecondary, fontSize: 12, marginBottom: 8, marginTop: 4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  categoryOptionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryText: { color: colors.textSecondary, fontSize: 13 },
  categoryTextSelected: { color: colors.accentText, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  messageInput: { minHeight: 160, textAlignVertical: 'top', paddingTop: 10 },
  counter: { color: colors.textMuted, fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
});
