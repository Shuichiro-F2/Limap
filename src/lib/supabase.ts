import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Limap] SUPABASE_URL / SUPABASE_ANON_KEY が未設定です。.env を .env.example からコピーして設定してください。'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // OAuthのリダイレクト後にURLからセッションを拾えるのはWebだけ。
    // ネイティブ側でこれをtrueにするとwindow前提の処理で落ちる可能性があるため分岐する。
    detectSessionInUrl: Platform.OS === 'web',
  },
});
