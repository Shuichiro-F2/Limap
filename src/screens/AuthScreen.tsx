import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
import { colors } from '../lib/theme';

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, username);
        notify('確認メールを送信しました', 'メール内のリンクから登録を完了してください。');
      }
    } catch (e: any) {
      notify('エラー', e.message ?? '処理に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Limap</Text>
      <Text style={styles.tagline}>世界のリミナルスペースを記録する</Text>

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

      <Pressable style={styles.oauthButton} onPress={() => signInWithOAuth('google')}>
        <Text style={styles.oauthButtonText}>Googleでログイン</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 34, fontWeight: '700', color: colors.accent, textAlign: 'center' },
  tagline: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
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
});
