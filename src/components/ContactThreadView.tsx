import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { colors } from '../lib/theme';
import type { ContactMessage } from '../types/database';

type Props = {
  messages: ContactMessage[];
  loading?: boolean;
  currentUserId?: string;
  sending?: boolean;
  onSend: (body: string) => Promise<void> | void;
  // スレッドが対応完了の場合、返信欄の代わりに案内文を出す(ユーザー側画面などで使用)。
  disabled?: boolean;
  disabledMessage?: string;
};

// 運営とユーザーの問い合わせ会話を表示する、ユーザー側・管理者側で共通のチャットUI。
// メッセージの左右寄せは「今この画面を見ている本人が送ったかどうか」だけで決める。
export default function ContactThreadView({
  messages,
  loading = false,
  currentUserId,
  sending = false,
  onSend,
  disabled = false,
  disabledMessage,
}: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await onSend(trimmed);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.emptyText}>まだメッセージはありません</Text>}
          renderItem={({ item }) => {
            const isOwn = item.sender_id === currentUserId;
            const label = isOwn
              ? 'あなた'
              : item.is_admin
                ? 'サポート'
                : item.sender?.display_name || item.sender?.username || 'ユーザー';
            return (
              <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
                <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                  <Text style={styles.bubbleLabel}>{label}</Text>
                  <Text style={isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {disabled ? (
        <View style={styles.disabledBar}>
          <Text style={styles.disabledText}>{disabledMessage ?? 'このスレッドは対応完了になっています'}</Text>
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="メッセージを入力"
            placeholderTextColor="#666"
            multiline
          />
          <Pressable style={styles.sendButton} onPress={submit} disabled={sending || !draft.trim()}>
            {sending ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Text style={styles.sendButtonText}>送信</Text>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, flexGrow: 1 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12 },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther: { backgroundColor: colors.surface, borderTopLeftRadius: 2 },
  bubbleOwn: { backgroundColor: colors.accent, borderTopRightRadius: 2 },
  bubbleLabel: { color: colors.textMuted, fontSize: 10, marginBottom: 4 },
  bubbleTextOther: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  bubbleTextOwn: { color: colors.accentText, fontSize: 14, lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 14 },
  disabledBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  disabledText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
