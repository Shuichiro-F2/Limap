import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Text from '../components/AppText';
import { Button, FormField, FormInput, formStyles } from '../components/Form';
import { googleLoginAvailable, useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { translateAuthError } from '../lib/authErrors';
import { useLanguage, useTranslation } from '../lib/i18n';
import { colors, space, type } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

export default function AuthScreen({ navigation, route }: RootStackScreenProps<'Auth'>) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, signInWithApple } = useAuth();
  const { language } = useLanguage();
  const t = useTranslation().auth;
  // 初回起動時のWelcome画面から「アカウントを作成」で来た場合は、最初から新規登録モードで開く。
  const [mode, setMode] = useState<'signin' | 'signup'>(route.params?.mode ?? 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  // 利用規約・プライバシーポリシーへの同意（アカウント作成時のみ必須）
  const [agreed, setAgreed] = useState(false);

  const requiresAgreement = mode === 'signup' && !agreed;

  // 投稿しようとしてログインを求められた場合は、ログイン後にそのまま投稿の画面へ進む。
  // それ以外は、遷移元の画面（マイページなど）に戻る。Authはモーダルとして積まれているため、
  // 戻り先がなければトップページ（地図）へ遷移する。
  const next = route.params?.next;
  const nextSpotId = route.params?.spotId;
  const finish = () => {
    if (next === 'CreateSpot') {
      navigation.replace('CreateSpot');
    } else if (next === 'AddReview' && nextSpotId) {
      navigation.replace('AddReview', { spotId: nextSpotId });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'MapTab' });
    }
  };

  const submit = async () => {
    if (requiresAgreement) {
      notify(t.confirmTitle, t.agreementRequired);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        finish();
      } else {
        const { alreadyRegistered } = await signUpWithEmail(email, password, username);
        if (alreadyRegistered) {
          notify(t.alreadyRegisteredTitle, t.alreadyRegisteredMessage);
        } else {
          notify(t.confirmationSentTitle, t.confirmationSentMessage);
        }
      }
    } catch (e: any) {
      notify(t.errorTitle, translateAuthError(e?.message, language));
    } finally {
      setBusy(false);
    }
  };

  // Googleログインのボタンは、Webと、expo-web-browser入りのネイティブビルド（1.1.0以降）でだけ出す
  // （古いビルドにはネイティブでログイン画面を開く手段がないため。lib/AuthContext.tsx 参照）。
  const showGoogle = googleLoginAvailable;
  const hasOAuthButtons = showGoogle || Platform.OS === 'ios';

  // GoogleでのログインボタンはSupabase側で新規登録・既存ログイン共通のため、
  // signupモードの場合のみここで同意チェックを行ってからOAuthを開始する
  // （OAuthはリダイレクトを伴うため、開始後に途中キャンセルする手段がない）
  const handleGoogleAuth = async () => {
    if (requiresAgreement) {
      notify(t.confirmTitle, t.agreementRequired);
      return;
    }
    setBusy(true);
    try {
      // Webはこのままページごとリダイレクトする。ネイティブはアプリ内のブラウザでログインし、
      // 完了したらAppleログインと同じように前の画面へ戻る
      const signedIn = await signInWithOAuth('google');
      if (signedIn) finish();
    } catch (e: any) {
      notify(t.errorTitle, translateAuthError(e?.message, language));
    } finally {
      setBusy(false);
    }
  };

  // Apple公式ログイン(iOSネイティブのみ)。GoogleログインのようなOAuthリダイレクトではなく
  // その場で完結するため、成功後はGoogleと違い自前で画面遷移まで行う。
  const handleAppleAuth = async () => {
    if (requiresAgreement) {
      notify(t.confirmTitle, t.agreementRequired);
      return;
    }
    setBusy(true);
    try {
      await signInWithApple();
      finish();
    } catch (e: any) {
      notify(t.errorTitle, translateAuthError(e?.message, language));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[formStyles.content, styles.content]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />

        {/* 投稿しようとして来た人に、なぜログインが要るのかを伝える */}
        {next && (
          <Text variant="body" style={styles.nextNote}>
            {t.postNeedsAccount}
          </Text>
        )}

        <View style={styles.fields}>
          {mode === 'signup' && (
            <FormField label={t.username}>
              <FormInput value={username} onChangeText={setUsername} autoCapitalize="none" autoComplete="username" />
            </FormField>
          )}
          <FormField label={t.email}>
            <FormInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </FormField>
          <FormField label={t.password}>
            <FormInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </FormField>

          {mode === 'signup' && (
            <View style={styles.agreementRow}>
              <Pressable
                style={[styles.checkbox, agreed && styles.checkboxChecked]}
                onPress={() => setAgreed(!agreed)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
              >
                {agreed && <Ionicons name="checkmark" size={15} color={colors.accentText} />}
              </Pressable>
              <Text variant="body" style={styles.agreementText}>
                {t.agreePrefix}
                <Text variant="body" style={styles.agreementLink} onPress={() => navigation.navigate('Terms')}>
                  {t.terms}
                </Text>
                {t.agreeAnd}
                <Text variant="body" style={styles.agreementLink} onPress={() => navigation.navigate('Privacy')}>
                  {t.privacy}
                </Text>
                {t.agreeSuffix}
              </Text>
            </View>
          )}
        </View>

        <Button label={mode === 'signin' ? t.signIn : t.signUp} onPress={submit} loading={busy} style={styles.submit} />

        {/* ログインと新規登録の切り替え。見落とされないよう、切り替え先を黄色の文字で示す */}
        <Pressable
          style={styles.switchRow}
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text variant="body" style={styles.switchText}>
            {mode === 'signin' ? t.noAccount : t.haveAccount}
          </Text>
          <Text style={styles.switchLink}>{mode === 'signin' ? t.toSignUp : t.toSignIn}</Text>
        </Pressable>

        {hasOAuthButtons && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="body" style={styles.dividerText}>
                {t.or}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.oauthButtons}>
              {showGoogle && <Button variant="secondary" icon="logo-google" label={t.google} onPress={handleGoogleAuth} />}

              {/* Sign in with AppleはiOSネイティブでのみ利用可能。Appleのデザインガイドラインに
                  沿うため、独自ボタンではなく公式コンポーネント(AppleAuthenticationButton)を使う。 */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={25}
                  style={styles.appleButton}
                  onPress={handleAppleAuth}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // 画面の高さに余裕があるときは、上下の中央に寄せる
  content: { flexGrow: 1, justifyContent: 'center', maxWidth: 420 },
  logo: { width: 150, height: 96, alignSelf: 'center', marginBottom: space.xxl },
  nextNote: { color: colors.textSecondary, textAlign: 'center', marginTop: -space.l, marginBottom: space.l },
  fields: { gap: 20 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  agreementText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  agreementLink: { color: colors.accent, textDecorationLine: 'underline' },
  submit: { marginTop: space.xl },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  switchText: { color: colors.textSecondary, fontSize: 14 },
  switchLink: { color: colors.accent, fontSize: type.body },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, marginVertical: space.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 12 },
  oauthButtons: { gap: space.m },
  appleButton: { width: '100%', height: 50 },
});
