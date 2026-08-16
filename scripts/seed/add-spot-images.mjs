// 公式アカウントが投稿済みのスポットに、写真を追加するスクリプト。
//
// - content/spot-images.json に載っている項目は、Wikimedia CommonsのCCライセンス画像
//   (CC0 / CC BY / CC BY-SA など、再配布・改変が許諾されているものだけ) をダウンロードして
//   Supabase Storageにアップロードし、spot_images に登録する。
//   あわせて、投稿の説明欄の末尾に画像の出典クレジットを追記する。
// - content/spot-images.json に載っていない(=CCライセンス画像が見つからなかった)スポットには、
//   assets/seed/no-image-placeholder.jpg を代わりに登録する。
// - 既にそのスポットに画像が1枚以上登録済みの場合はスキップする(再実行しても重複登録されない)。
//
// 使い方（このリポジトリのルートで、通常のネット接続がある環境で実行すること）:
//   OFFICIAL_EMAIL="xxx@example.com" OFFICIAL_PASSWORD="xxxxxxxx" node scripts/seed/add-spot-images.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

// Node 20以下にはネイティブのWebSocketがなく、supabase-jsの内部クライアント初期化時に
// エラーになるため、wsパッケージをグローバルに補完しておく（Realtime機能自体は未使用）。
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../');

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  const text = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error('.env に SUPABASE_URL / SUPABASE_ANON_KEY が見つかりません');
  process.exit(1);
}

const email = process.env.OFFICIAL_EMAIL;
const password = process.env.OFFICIAL_PASSWORD;
if (!email || !password) {
  console.error('環境変数 OFFICIAL_EMAIL / OFFICIAL_PASSWORD を指定してください');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// このスクリプトが対象とする、公式アカウントの投稿データ一式(名前 -> 説明文の対応を取るため)
const SEED_FILES = ['content/seed-spots.json', 'content/seed-spots-batch2.json'];
const IMAGE_MAP_FILE = 'content/spot-images.json';
const PLACEHOLDER_FILE = path.join(ROOT, 'assets/seed/no-image-placeholder.jpg');

// Wikimedia Commonsは匿名の一般的なUser-Agentでのアクセスを推奨していないため、
// 連絡先を含む識別可能なUser-Agentを付けてリクエストする。
const WIKIMEDIA_UA = 'LIMapSeedBot/1.0 (https://limap.jp; contact: hinan.evacuate@gmail.com)';

function loadSeedSpots() {
  const all = [];
  for (const file of SEED_FILES) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    const items = JSON.parse(fs.readFileSync(p, 'utf-8'));
    all.push(...items);
  }
  return all;
}

function loadImageMap() {
  const p = path.join(ROOT, IMAGE_MAP_FILE);
  const items = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const map = new Map();
  for (const item of items) map.set(item.name, item);
  return map;
}

async function downloadCommonsImage(commonsFile) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFile)}`;
  const res = await fetch(url, { headers: { 'User-Agent': WIKIMEDIA_UA } });
  if (!res.ok) throw new Error(`画像ダウンロード失敗 (${res.status}): ${commonsFile}`);
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

function loadPlaceholder() {
  const buffer = fs.readFileSync(PLACEHOLDER_FILE);
  return { buffer, contentType: 'image/jpeg' };
}

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('ログイン失敗:', signInError.message);
    process.exit(1);
  }
  const authorId = signInData.user.id;
  console.log(`ログイン成功 (author_id: ${authorId})`);

  const seedSpots = loadSeedSpots();
  const imageMap = loadImageMap();
  console.log(`対象スポット候補: ${seedSpots.length}件\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const [i, item] of seedSpots.entries()) {
    const description = (item.description || '').trim();
    const label = `[${i + 1}/${seedSpots.length}] ${item.name}`;

    // 説明文でスポットを特定する(import-spots.mjsの重複チェックと同じキー)
    const { data: spot, error: findError } = await supabase
      .from('spots')
      .select('id, description, images:spot_images(id)')
      .eq('author_id', authorId)
      .eq('description', description)
      .maybeSingle();

    if (findError) {
      failed++;
      console.error(`${label} - 検索失敗:`, findError.message);
      continue;
    }
    if (!spot) {
      skipped++;
      console.log(`${label} - skip (該当スポットが未登録。先にimport-spots.mjsを実行してください)`);
      continue;
    }
    if ((spot.images ?? []).length > 0) {
      skipped++;
      console.log(`${label} - skip (既に画像あり)`);
      continue;
    }

    const imageInfo = imageMap.get(item.name);

    try {
      let buffer, contentType, creditText;
      if (imageInfo) {
        ({ buffer, contentType } = await downloadCommonsImage(imageInfo.commonsFile));
        creditText = `\n\n掲載写真: ${imageInfo.author}（出典: Wikimedia Commons, ${imageInfo.license}, ${imageInfo.sourceUrl}）`;
      } else {
        ({ buffer, contentType } = loadPlaceholder());
        creditText = null;
      }

      const ext = contentType.includes('png') ? 'png' : 'jpg';
      const storagePath = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('spot-images')
        .upload(storagePath, buffer, { contentType, upsert: false });
      if (uploadError) throw uploadError;

      const { error: imgInsertError } = await supabase
        .from('spot_images')
        .insert({ spot_id: spot.id, storage_path: storagePath, position: 0 });
      if (imgInsertError) throw imgInsertError;

      if (creditText) {
        const { error: updateError } = await supabase
          .from('spots')
          .update({ description: description + creditText })
          .eq('id', spot.id);
        if (updateError) throw updateError;
      }

      done++;
      console.log(`${label} - 完了 ${imageInfo ? '(Commons画像)' : '(No Imageプレースホルダー)'}`);
    } catch (e) {
      failed++;
      console.error(`${label} - 失敗:`, e.message);
    }
  }

  console.log(`\n完了: 処理 ${done} / スキップ ${skipped} / 失敗 ${failed}`);
}

main();
