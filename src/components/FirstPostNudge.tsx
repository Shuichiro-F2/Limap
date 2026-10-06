import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';

// 登録したのにまだ1件も投稿していない人に、地図の下で「最初の1か所」を案内するカード。
// 閉じたらこの端末では二度と出さない。投稿（スポット・行ってきた投稿）が1件でもあれば出さない。
// 登録した人のほとんどが投稿しないまま、という状況（scripts/growth-stats.mjs）を変えるための導線。

const DISMISSED_KEY = 'limap.firstPostNudgeDismissed.v1';

export default function FirstPostNudge({ onPost }: { onPost: () => void }) {
  const { session } = useAuth();
  const t = useTranslation().map;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if ((await AsyncStorage.getItem(DISMISSED_KEY)) === '1') return;
        const [spots, reviews] = await Promise.all([
          supabase.from('spots').select('id', { count: 'exact', head: true }).eq('author_id', userId),
          supabase.from('spot_reviews').select('id', { count: 'exact', head: true }).eq('author_id', userId),
        ]);
        if (spots.error || reviews.error) return;
        if (!cancelled && (spots.count ?? 0) === 0 && (reviews.count ?? 0) === 0) setVisible(true);
      } catch {
        // 案内を出さないだけで、地図の表示には影響させない
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t.firstPostTitle}</Text>
        <Text variant="body" style={styles.body}>
          {t.firstPostBody}
        </Text>
        <Pressable style={styles.button} onPress={onPost} accessibilityRole="button">
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={styles.buttonText}>{t.firstPostButton}</Text>
        </Pressable>
      </View>
      <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.firstPostClose}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.s,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.m,
  },
  textCol: { flex: 1, gap: 6 },
  title: { color: colors.textPrimary, fontSize: type.body },
  body: { color: colors.textSecondary, fontSize: type.small, lineHeight: 19 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buttonText: { color: colors.accentText, fontSize: type.small },
});
