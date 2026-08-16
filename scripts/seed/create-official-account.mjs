// 公式アカウント（コンテンツ登録用）を作成するスクリプト。
// 通常のサインアップと同じ supabase.auth.signUp を使う（管理者権限のservice roleキーは使わない）。
// メール確認が必要な場合は、確認メール内のリンクを開くまでログインできない。
// 実行後、確認メールのリンクを開いて `node create-official-account.mjs --confirm-only` で
// ログイン確認するか、confirm-link.mjsで別途処理する。
//
// 使い方: node scripts/seed/create-official-account.mjs
// 環境変数 OFFICIAL_EMAIL / OFFICIAL_PASSWORD / OFFICIAL_USERNAME を外部から渡す。

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

function loadEnv() {
  const envPath = new URL('../../.env', import.meta.url);
  const text = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

const email = process.env.OFFICIAL_EMAIL;
const password = process.env.OFFICIAL_PASSWORD;
const username = process.env.OFFICIAL_USERNAME || 'limap_official';
const displayName = process.env.OFFICIAL_DISPLAY_NAME || 'LIMap公式';

if (!email || !password) {
  console.error('OFFICIAL_EMAIL / OFFICIAL_PASSWORD を環境変数で指定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { username, display_name: displayName } },
});

if (error) {
  console.error('signUp error:', error.message);
  process.exit(1);
}

console.log('signUp result:');
console.log('  user id:', data.user?.id);
console.log('  email confirmed:', !!data.user?.email_confirmed_at);
console.log('  session issued immediately:', !!data.session);
