import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay, isIOSDevice, usePwaInstallPrompt } from '../lib/pwaInstall';

// Web版限定: ブラウザでトップ画面(地図タブ)を開いた際に、まだホーム画面に
// 追加していない場合だけ表示する軽い案内ポップアップ。
// 一度閉じたら(またはインストール済みになったら)この端末では再表示しない。
const DISMISS_KEY = 'limap-a2hs-popup-dismissed';
const SHOW_DELAY_MS = 1800;

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function setDismissed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // localStorageが使えない環境では諦める(次回また表示されるだけで実害はない)
  }
}

export default function AddToHomeScreenPopup() {
  const t = useTranslation();
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const { canPromptInstall, promptInstall } = usePwaInstallPrompt();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isStandaloneDisplay() || isDismissed()) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDismissed();
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstalled(true);
      setDismissed();
      setTimeout(() => setVisible(false), 1400);
    }
  };

  if (Platform.OS !== 'web' || !visible) return null;

  const ios = isIOSDevice();

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable style={styles.closeButton} onPress={dismiss} hitSlop={10}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.accentText} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{t.addToHome.popupTitle}</Text>
            <Text style={styles.lead}>{ios ? t.addToHome.popupLeadIos : t.addToHome.popupLeadAndroid}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={dismiss} hitSlop={8}>
            <Text style={styles.laterText}>{t.addToHome.popupLater}</Text>
          </Pressable>

          {!ios && (
            <Pressable style={styles.installButton} onPress={handleInstall} disabled={installed}>
              <Ionicons
                name={installed ? 'checkmark' : 'download-outline'}
                size={16}
                color={colors.accentText}
              />
              <Text style={styles.installButtonText}>
                {installed ? t.addToHome.androidSuccess : t.addToHome.androidButton}
              </Text>
            </Pressable>
          )}

          {ios && (
            <View style={styles.shareHint}>
              <Ionicons name="share-outline" size={16} color={colors.accent} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

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
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  installButtonText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  shareHint: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
