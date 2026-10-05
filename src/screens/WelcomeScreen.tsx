import React from 'react';
import { View, Image, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { colors } from '../lib/theme';
import { markWelcomeSeen } from '../lib/firstLaunch';
import { useTranslation } from '../lib/i18n';
import type { RootStackScreenProps } from '../navigation/types';

// ネイティブアプリ限定: インストール後の初回起動時にだけ、全画面で表示する導入画面。
// アカウント作成/ログインを促すが、閲覧自体はログイン不要な設計のため
// 「ログインせずに見る」導線を必ず残しておく
// (完全なログイン壁はApp Store審査ガイドライン5.1.1(v)に抵触するリスクがあるため)。
//
// この画面はRootNavigatorの初期ルートとして表示され、どのボタンを押しても
// replaceで置き換わるので、後から戻ってくることはない。

export default function WelcomeScreen({ navigation }: RootStackScreenProps<'Welcome'>) {
  const t = useTranslation().welcome;
  const features: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'camera-outline', text: t.featurePost },
    { icon: 'bookmark-outline', text: t.featureSave },
    { icon: 'people-outline', text: t.featureFollow },
  ];
  // 一度でも操作したら、この端末では二度と表示しない
  const leave = (to: 'signup' | 'signin' | 'skip') => {
    markWelcomeSeen();
    if (to === 'skip') {
      navigation.replace('Main');
    } else {
      // replaceで置き換えることで、ログイン完了後にこの画面へ戻ってしまうのを防ぐ
      // (AuthScreenは canGoBack() が false なら地図画面へ遷移する)
      navigation.replace('Auth', { mode: to });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heading}>{t.heading}</Text>
          <Text style={styles.lead}>{t.lead}</Text>
        </View>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={17} color={colors.accent} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => leave('signup')}>
          <Text style={styles.primaryButtonText}>{t.signUp}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => leave('signin')}>
          <Text style={styles.secondaryButtonText}>{t.signIn}</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={() => leave('skip')} hitSlop={8}>
          <Text style={styles.skipText}>{t.skip}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 24 },
  hero: { alignItems: 'center' },
  logo: { width: 180, height: 114, marginBottom: 28 },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 14,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
  },
  features: { marginTop: 36, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 },
  actions: { paddingHorizontal: 28, paddingBottom: 12, paddingTop: 24 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 14 },
  skipButton: { alignItems: 'center', paddingVertical: 16, marginTop: 2 },
  skipText: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
