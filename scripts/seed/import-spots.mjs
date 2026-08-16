// 公式アカウントで、まとめてスポットを登録するスクリプト。
// 写真は使わず、位置情報・説明文・タグのみで投稿する（app側のcreateSpot()と同じテーブル構成）。
// 実行前に、公式アカウントの作成とメール確認を済ませておくこと。
//
// 使い方（このリポジトリのルートで実行。サンドボックスではなく、通常のネット接続がある環境で実行すること）:
//   OFFICIAL_EMAIL="xxx@example.com" OFFICIAL_PASSWORD="xxxxxxxx" node scripts/seed/import-spots.mjs
//   （データファイルを差し替える場合は第1引数でパスを指定: ... node scripts/seed/import-spots.mjs content/seed-spots-batch2.json）
//
// 同じ投稿者・同じ説明文の投稿がすでにあればスキップするため、何度再実行しても重複登録されない。

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

const dataArg = process.argv[2] || 'content/seed-spots.json';
const dataPath = path.isAbsolute(dataArg) ? dataArg : path.join(__dirname, '../../', dataArg);
const spots = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function findOrCreateTag(tagCache, name) {
  if (tagCache.has(name)) return tagCache.get(name);
  const { data: existing } = await supabase.from('tags').select('id, name').ilike('name', name).maybeSingle();
  if (existing) {
    tagCache.set(name, existing.id);
    return existing.id;
  }
  const { data: created, error } = await supabase.from('tags').insert({ name }).select('id').single();
  if (error) {
    const { data: fallback } = await supabase.from('tags').select('id').ilike('name', name).maybeSingle();
    if (fallback) {
      tagCache.set(name, fallback.id);
      return fallback.id;
    }
    throw error;
  }
  tagCache.set(name, created.id);
  return created.id;
}

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('ログイン失敗:', signInError.message);
    console.error('先にアカウント作成とメール確認を完了してください。');
    process.exit(1);
  }
  const authorId = signInData.user.id;
  console.log(`ログイン成功 (author_id: ${authorId})`);
  console.log(`${spots.length}件のデータを処理します...\n`);

  const tagCache = new Map();
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [i, item] of spots.entries()) {
    const description = (item.description || '').trim();
    const title = description.slice(0, 40) || '無題の投稿';
    const label = `[${i + 1}/${spots.length}] ${item.name ?? title}`;

    if (typeof item.lat !== 'number' || typeof item.lng !== 'number') {
      failed++;
      console.error(`${label} - lat/lngが不正です`);
      continue;
    }

    const { data: dup } = await supabase
      .from('spots')
      .select('id')
      .eq('author_id', authorId)
      .eq('description', description)
      .maybeSingle();
    if (dup) {
      skipped++;
      console.log(`${label} - skip (既存)`);
      continue;
    }

    try {
      const { data: spot, error } = await supabase
        .from('spots')
        .insert({
          author_id: authorId,
          title,
          description,
          lat: item.lat,
          lng: item.lng,
          country: item.country ?? '日本',
          city: item.city ?? null,
        })
        .select('id, slug')
        .single();
      if (error) throw error;

      if (item.tags?.length) {
        const tagIds = [];
        for (const tagName of item.tags) {
          tagIds.push(await findOrCreateTag(tagCache, tagName));
        }
        const { error: tagError } = await supabase
          .from('spot_tags')
          .insert(tagIds.map((tagId) => ({ spot_id: spot.id, tag_id: tagId })));
        if (tagError) throw tagError;
      }

      created++;
      console.log(`${label} - 作成 (/spot/${spot.slug})`);
    } catch (e) {
      failed++;
      console.error(`${label} - 失敗:`, e.message);
    }
  }

  console.log(`\n完了: 作成 ${created} / スキップ ${skipped} / 失敗 ${failed}`);
}

main();
