import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isSupportAvailable, openSupportPage } from '../lib/support';
import { willShowAddToHomeScreenPopup } from './AddToHomeScreenPopup';

// Web版限定: 起動後しばらくしてから画面下部に出す、Ko-fiでの支援の案内ポップアップ。
// 世界観を損なわないよう、しつこくならない出し方にしている。
//
// 表示ルール:
//   - Web版のみ(App Store審査への配慮。lib/support.ts参照)
//   - 初回訪問では出さない。まず地図を体験してもらい、2回目以降の訪問から表示する
//   - 1回の訪問(ブラウザのセッション)につき最大1回
//   - 「後で」で閉じたら SNOOZE_DAYS 日間は出さない
//   - 支援ページを開いたら SUPPORTED_SNOOZE_DAYS 日間は出さない
//   - ホーム画面追加ポップアップ(Android等)が出る訪問では、重ならないよう出さない
const VISIT_COUNT_KEY = 'limap-visit-count';
const VISIT_SESSION_KEY = 'limap-visit-counted';
const SNOOZE_UNTIL_KEY = 'limap-support-popup-snooze-until';

const MIN_VISITS = 2;
const SNOOZE_DAYS = 14;
const SUPPORTED_SNOOZE_DAYS = 90;
const SHOW_DELAY_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;

// 訪問回数をセッションごとに1回だけ数え、現在の回数を返す
function countVisit(): number {
  try {
    const current = Number(window.localStorage.getItem(VISIT_COUNT_KEY) ?? '0') || 0;
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === '1') return current;
    window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    const next = current + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(next));
    return next;
  } catch {
    // ストレージが使えない環境では回数を数えられないため、表示しない側に倒す
    return 0;
  }
}

function isSnoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(SNOOZE_UNTIL_KEY) ?? '0') || 0;
    return Date.now() < until;
  } catch {
    return true;
  }
}

function snooze(days: number) {
  try {
    window.localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + days * DAY_MS));
  } catch {
    // 保存できなくても致命的ではない
  }
}

export default function SupportPopup() {
  const t = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSupportAvailable || typeof window === 'undefined') return;
    const visits = countVisit();
    if (visits < MIN_VISITS || isSnoozed()) return;
    if (willShowAddToHomeScreenPopup()) return;
    const timer = setTimeout(() => {
      // 同じセッション内で再マウントされても二重に出さないよう、表示した時点で短期間スヌーズする
      snooze(SNOOZE_DAYS);
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isSupportAvailable || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    snooze(SNOOZE_DAYS);
  };

  const support = () => {
    setVisible(false);
    snooze(SUPPORTED_SNOOZE_DAYS);
    openSupportPage();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable style={styles.closeButton} onPress={dismiss} hitSlop={10} accessibilityLabel={t.support.close}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="bulb-outline" size={20} color={colors.accentText} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{t.support.title}</Text>
            <Text style={styles.lead}>{t.support.popupLead}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={dismiss} hitSlop={8}>
            <Text style={styles.laterText}>{t.support.later}</Text>
          </Pressable>
          <Pressable style={styles.supportButton} onPress={support} accessibilityRole="link">
            <Text style={styles.supportButtonText}>{t.support.action}</Text>
            <Ionicons name="open-outline" size={14} color={colors.accentText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// 見た目はホーム画面追加ポップアップ(AddToHomeScreenPopup)と揃えている
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    alignItems: 'center',
    zIndex: 20,
  },
  card: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  closeButton: { position: 'absolute', right: 10, top: 10, padding: 6 },
  row: { flexDirection: 'row', gap: 12, paddingRight: 16 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  lead: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 14,
  },
  laterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  supportButtonText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
});
