// 公式アカウントが投稿した全スポットを削除するクリーンアップスクリプト。
// 座標・説明文が不正確だった最初のバッチをやり直すために使う。
// 実行後、正しいデータで scripts/seed/import-spots.mjs を再実行すること。
//
// 使い方:
//   OFFICIAL_EMAIL="xxx@example.com" OFFICIAL_PASSWORD="xxxxxxxx" node scripts/seed/delete-official-spots.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  const text = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const email = process.env.OFFICIAL_EMAIL;
const password = process.env.OFFICIAL_PASSWORD;
if (!email || !password) {
  console.error('環境変数 OFFICIAL_EMAIL / OFFICIAL_PASSWORD を指定してください');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('ログイン失敗:', signInError.message);
    process.exit(1);
  }
  const authorId = signInData.user.id;

  const { data: spots, error } = await supabase
    .from('spots')
    .select('id, title, slug, images:spot_images(storage_path)')
    .eq('author_id', authorId);
  if (error) {
    console.error('取得失敗:', error.message);
    process.exit(1);
  }

  console.log(`author_id ${authorId} の投稿 ${spots.length} 件を削除します...`);

  for (const spot of spots) {
    const paths = (spot.images ?? []).map((img) => img.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from('spot-images').remove(paths);
    }
    const { error: delError } = await supabase.from('spots').delete().eq('id', spot.id);
    if (delError) {
      console.error(`削除失敗: ${spot.title} -`, delError.message);
    } else {
      console.log(`削除: ${spot.title}`);
    }
  }

  console.log('\n完了');
}

main();
