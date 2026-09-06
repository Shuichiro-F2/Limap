import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay, isIOSDevice } from '../lib/pwaInstall';
import { openAppStore } from '../lib/appStore';

// Web版のiOS端末限定: 画面最上部に出すApp Store誘導バナー。
// iOSアプリをリリースしたため、iOSでは「ホーム画面に追加」(PWA)ではなく
// ネイティブアプリのインストールを案内する。
//
// MainTabNavigator側で通常フローの要素として配置しているため、
// このバナーが表示されている間はアプリ本体がその分だけ下に押し下がる
// (position:absoluteで重ねると、透過ヘッダーのロゴと被ってしまうため)。
//
// 表示しない条件:
//   - ネイティブアプリ版(そもそも不要)
//   - iOS以外の端末(Android向けは従来どおりAddToHomeScreenPopupが担当)
//   - すでにホーム画面から起動している(スタンドアロン表示)
//   - 一度閉じた端末(localStorageに記録)
const DISMISS_KEY = 'limap-ios-app-banner-dismissed';

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

export default function AppStoreBanner() {
  const t = useTranslation();
  // サーバーサイドレンダリング/初回HTMLと描画結果がズレないよう、
  // 判定はマウント後(useEffect)に行い、初期状態は必ず非表示にしておく。
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isIOSDevice()) return;
    if (isStandaloneDisplay() || isDismissed()) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    setDismissed();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable style={styles.closeButton} onPress={dismiss} hitSlop={10} accessibilityLabel={t.appBanner.close}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>

        <Image source={require('../../assets/icon.png')} style={styles.icon} resizeMode="cover" />

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {t.appBanner.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t.appBanner.subtitle}
          </Text>
        </View>

        <Pressable style={styles.installButton} onPress={openAppStore} hitSlop={6}>
          <Text style={styles.installButtonText}>{t.appBanner.action}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 30,
  },
  row: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  closeButton: { padding: 4 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: colors.background,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  installButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  installButtonText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
});
