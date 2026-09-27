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
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
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
  const t = useTranslation().contact;
  // 画面上部の見出し（ヘッダー）の高さ分を差し引かないと、キーボードが出たときに入力欄が隠れる
  const headerHeight = useHeaderHeight();
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text variant="body" style={styles.emptyText}>
              {t.threadEmpty}
            </Text>
          }
          renderItem={({ item }) => {
            const isOwn = item.sender_id === currentUserId;
            const label = isOwn
              ? t.you
              : item.is_admin
                ? t.support
                : item.sender?.display_name || item.sender?.username || t.user;
            return (
              <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
                <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                  <Text style={styles.bubbleLabel}>{label}</Text>
                  <Text variant="body" style={isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther}>
                    {item.body}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {disabled ? (
        <View style={styles.disabledBar}>
          <Text variant="body" style={styles.disabledText}>
            {disabledMessage ?? t.threadClosed}
          </Text>
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            variant="body"
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t.replyPlaceholder}
            multiline
          />
          <Pressable
            style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
            onPress={submit}
            disabled={sending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel={t.reply}
          >
            {sending ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color={colors.accentText} />
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: space.l, flexGrow: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
  bubbleRow: { flexDirection: 'row', marginBottom: space.m },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: radius.m, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  bubbleOwn: { backgroundColor: colors.accent, borderTopRightRadius: 4 },
  bubbleLabel: { color: colors.textMuted, fontSize: type.caption, marginBottom: space.xs },
  bubbleTextOther: { color: colors.textPrimary, fontSize: 14, lineHeight: 22 },
  bubbleTextOwn: { color: colors.accentText, fontSize: 14, lineHeight: 22 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.s,
    padding: space.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: space.l,
    paddingVertical: 10,
    color: colors.textPrimary,
    // 16px未満だとiOS Safariがフォーカス時に画面を自動で拡大してしまうため16にする
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.45 },
  disabledBar: {
    padding: space.l,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  disabledText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
