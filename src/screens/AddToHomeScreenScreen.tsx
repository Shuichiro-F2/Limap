import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay, isIOSDevice, usePwaInstallPrompt } from '../lib/pwaInstall';

// Web版限定の「ホーム画面に追加」案内ページ。
// iOSはOSレベルで「追加」を直接呼び出すJS APIが存在しないため手順を案内する形にし、
// Android(Chrome等)はbeforeinstallpromptイベントを使って実際にダイアログを呼び出せるようにする。
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
        <Text style={styles.heading}>{t.addToHome.heading}</Text>
        <Text style={styles.lead}>{t.addToHome.lead}</Text>

        {alreadyStandalone ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            <Text style={styles.doneText}>{t.addToHome.alreadyInstalled}</Text>
          </View>
        ) : (
          <>
            {ios && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>{t.addToHome.iosHeading}</Text>
                <Step index={1} icon="share-outline" text={t.addToHome.iosStep1} />
                <Step index={2} icon="add-circle-outline" text={t.addToHome.iosStep2} />
                <Step index={3} icon="checkmark-outline" text={t.addToHome.iosStep3} />
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
              <Text style={[styles.hintText, styles.otherHint]}>{t.addToHome.otherHint}</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ index, icon, text }: { index: number; icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{index}</Text>
      </View>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.stepIcon} />
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionHeading: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  stepIcon: { width: 20 },
  stepText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
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
