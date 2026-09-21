import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isSupportAvailable, openSupportPage } from '../lib/support';

// 読み物ページの末尾に置く、Ko-fiでの支援の案内カード。
// 地図やスポット詳細には置かず、世界観を邪魔しない場所に控えめに表示する方針。
// Web版限定(理由は lib/support.ts を参照)。
export default function SupportCard() {
  const t = useTranslation();
  if (!isSupportAvailable) return null;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={18} color={colors.accent} />
        <Text style={styles.title}>{t.support.title}</Text>
      </View>
      <Text style={styles.body}>{t.support.body}</Text>
      <Pressable style={styles.button} onPress={openSupportPage} hitSlop={6} accessibilityRole="link">
        <Text style={styles.buttonText}>{t.support.action}</Text>
        <Ionicons name="open-outline" size={14} color={colors.accentText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 21, marginBottom: 16 },
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  buttonText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
});
