import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay, isIOSDevice, usePwaInstallPrompt } from '../lib/pwaInstall';
import { openAppStore } from '../lib/appStore';

// Web版限定の案内ページ。
// iOSアプリのリリース(2026年9月)以降、iOS端末ではPWAとしてホーム画面に追加する手順ではなく、
// App Storeのアプリ版を案内する。
// Android(Chrome等)はネイティブアプリを提供していないため、従来どおり
// beforeinstallpromptイベントを使って「ホーム画面に追加」ダイアログを呼び出せるようにする。
export default function AddToHomeScreenScreen() {
  const t = useTranslation();
  const { canPromptInstall, promptInstall } = usePwaInstallPrompt();
  const [installed, setInstalled] = useState(false);
  const alreadyStandalone = isStandaloneDisplay();
  const ios = isIOSDevice();

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{ios ? t.myPage.getApp : t.addToHome.heading}</Text>
        <Text style={styles.lead}>{ios ? t.addToHome.iosAppLead : t.addToHome.lead}</Text>

        {alreadyStandalone ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            <Text style={styles.doneText}>{t.addToHome.alreadyInstalled}</Text>
          </View>
        ) : (
          <>
            {ios && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>{t.addToHome.iosAppHeading}</Text>
                <Pressable style={styles.installButton} onPress={openAppStore}>
                  <Ionicons name="logo-apple" size={18} color={colors.accentText} />
                  <Text style={styles.installButtonText}>{t.addToHome.iosAppButton}</Text>
                </Pressable>
              </View>
            )}

            {!ios && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>{t.addToHome.androidHeading}</Text>
                {installed ? (
                  <View style={styles.doneBox}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                    <Text style={styles.doneText}>{t.addToHome.androidSuccess}</Text>
                  </View>
                ) : canPromptInstall ? (
                  <Pressable style={styles.installButton} onPress={handleInstall}>
                    <Ionicons name="download-outline" size={18} color={colors.accentText} />
                    <Text style={styles.installButtonText}>{t.addToHome.androidButton}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.hintText}>{t.addToHome.androidHint}</Text>
                )}
              </View>
            )}

            {ios && (
              <Text style={[styles.hintText, styles.otherHint]}>{t.addToHome.iosAppNote}</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionHeading: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  installButtonText: { color: colors.accentText, fontSize: 14, fontWeight: '700' },
  doneBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  doneText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  hintText: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  otherHint: { marginTop: 4 },
});
