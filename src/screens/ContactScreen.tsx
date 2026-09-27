import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { Button, ChoiceRow, FormField, FormInput, formStyles } from '../components/Form';
import ContactThreadView from '../components/ContactThreadView';
import { fetchMyThread, createThread, fetchThreadMessages, sendContactMessage } from '../lib/contact';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { ContactCategory, ContactThread, ContactMessage } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

const MESSAGE_MAX = 2000;

const CATEGORIES: ContactCategory[] = ['bug', 'request', 'other'];

type Props = RootStackScreenProps<'Contact'>;

// 運営への問い合わせ画面。初回はカテゴリ選択+本文でスレッドを作成し、
// 以降はチャット形式で運営とやり取りできる(運営からの返信もこの画面に届く)。
export default function ContactScreen(_props: Props) {
  const { session } = useAuth();
  const tc = useTranslation().contact;
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
      notify(tc.loginRequired);
      return;
    }
    const trimmed = firstMessage.trim();
    if (!trimmed) {
      notify(tc.messageRequired);
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
      notify(tc.sendFailedTitle, e.message);
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
      notify(tc.sendFailedTitle, e.message);
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
          contentContainerStyle={formStyles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text variant="body" style={styles.lead}>
            {tc.lead}
          </Text>

          <View style={styles.fields}>
            <FormField label={tc.category}>
              <ChoiceRow
                options={CATEGORIES.map((c) => ({ value: c, label: tc.categories[c] }))}
                value={category}
                onChange={(value) => value && setCategory(value)}
              />
            </FormField>

            <FormField label={tc.message}>
              <FormInput
                style={styles.messageInput}
                value={firstMessage}
                onChangeText={(text) => setFirstMessage(text.slice(0, MESSAGE_MAX))}
                placeholder={tc.messagePlaceholder}
                multiline
              />
              <Text variant="body" style={[formStyles.caption, styles.counter]}>
                {firstMessage.length} / {MESSAGE_MAX}
              </Text>
            </FormField>
          </View>

          <Button label={tc.send} onPress={startThread} loading={sending} style={styles.submitButton} />
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
  lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 23, marginBottom: 28 },
  fields: { gap: 24 },
  messageInput: { minHeight: 180 },
  counter: { alignSelf: 'flex-end', marginTop: -4 },
  submitButton: { marginTop: 32 },
});
