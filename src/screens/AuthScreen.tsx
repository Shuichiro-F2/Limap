import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { translateAuthError } from '../lib/authErrors';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

export default function AuthScreen({ navigation }: RootStackScreenProps<'Auth'>) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, signInWithApple } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  // 利用規約・プライバシーポリシーへの同意（アカウント作成時のみ必須）
  const [agreed, setAgreed] = useState(false);

  const requiresAgreement = mode === 'signup' && !agreed;

  const submit = async () => {
    if (requiresAgreement) {
      notify('確認してください', '利用規約とプライバシーポリシーへの同意が必要です。');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        // ログイン完了後、遷移元の画面（マイページなど）に戻る。
        // Authはモーダルとして積まれているため戻り先がなければトップページ（地図）へ遷移する。
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main', { screen: 'MapTab' });
        }
      } else {
        const { alreadyRegistered } = await signUpWithEmail(email, password, username);
        if (alreadyRegistered) {
          notify(
            '登録済みのメールアドレスです',
            'このメールアドレスはすでに登録されています。ログインをお試しください。'
          );
        } else {
          notify('確認メールを送信しました', 'メール内のリンクから登録を完了してください。');
        }
      }
    } catch (e: any) {
      notify('エラー', translateAuthError(e?.message));
    } finally {
      setBusy(false);
    }
  };

  // GoogleでのログインボタンはSupabase側で新規登録・既存ログイン共通のため、
  // signupモードの場合のみここで同意チェックを行ってからOAuthを開始する
  // （OAuthはリダイレクトを伴うため、開始後に途中キャンセルする手段がない）
  const handleGoogleAuth = () => {
    if (requiresAgreement) {
      notify('確認してください', '利用規約とプライバシーポリシーへの同意が必要です。');
      return;
    }
    signInWithOAuth('google');
  };

  // Apple公式ログイン(iOSネイティブのみ)。GoogleログインのようなOAuthリダイレクトではなく
  // その場で完結するため、成功後はGoogleと違い自前で画面遷移まで行う。
  const handleAppleAuth = async () => {
    if (requiresAgreement) {
      notify('確認してください', '利用規約とプライバシーポリシーへの同意が必要です。');
      return;
    }
    setBusy(true);
    try {
      await signInWithApple();
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main', { screen: 'MapTab' });
      }
    } catch (e: any) {
      notify('エラー', translateAuthError(e?.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="ユーザー名"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {mode === 'signup' && (
        <View style={styles.agreementRow}>
          <Pressable
            style={[styles.checkbox, agreed && styles.checkboxChecked]}
            onPress={() => setAgreed(!agreed)}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            {agreed && <Ionicons name="checkmark" size={14} color={colors.accentText} />}
          </Pressable>
          <Text style={styles.agreementText}>
            <Text
              style={styles.agreementLink}
              onPress={() => navigation.navigate('Terms')}
            >
              利用規約
            </Text>
            と
            <Text
              style={styles.agreementLink}
              onPress={() => navigation.navigate('Privacy')}
            >
              プライバシーポリシー
            </Text>
            に同意する
          </Text>
        </View>
      )}

      <Pressable style={styles.primaryButton} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.accentText} />
        ) : (
          <Text style={styles.primaryButtonText}>{mode === 'signin' ? 'ログイン' : '新規登録'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.switchText}>
          {mode === 'signin' ? 'アカウントを作成する' : 'すでにアカウントをお持ちの方'}
        </Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={styles.oauthButton} onPress={handleGoogleAuth}>
        <Text style={styles.oauthButtonText}>Googleでログイン</Text>
      </Pressable>

      {/* Sign in with AppleはiOSネイティブでのみ利用可能。Appleのデザインガイドラインに
          沿うため、独自ボタンではなく公式コンポーネント(AppleAuthenticationButton)を使う。 */}
      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={10}
          style={styles.appleButton}
          onPress={handleAppleAuth}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  logo: { width: 170, height: 108, alignSelf: 'center', marginBottom: 32 },
  input: {
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 2,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, marginBottom: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    backgroundColor: colors.background,
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  agreementText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 19 },
  agreementLink: { color: colors.accent, textDecorationLine: 'underline' },
  switchText: { color: colors.textSecondary, textAlign: 'center', marginTop: 16, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  oauthButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  oauthButtonText: { color: colors.textPrimary, fontSize: 14 },
  appleButton: { width: '100%', height: 44 },
});
