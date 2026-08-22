// 公式アカウントの既存投稿をメンテナンスするスクリプト。以下の2つをまとめて行う。
//
// 1) 重複登録の削除: ほぼ同じ座標(既定では100m以内)に複数の投稿がある場合、
//    同じ場所が重複登録されているとみなし、古い方(created_atが早い方)を削除する。
//    削除時はStorage上の画像ファイルも一緒に削除する(spot_images/spot_tags/spot_embeds
//    の行はspotsテーブルのON DELETE CASCADEで自動的に消える)。
// 2) 埋め込みサムネイルの反映: 残った投稿のSNS埋め込み(Instagram/X)のうち、
//    thumbnail_urlがまだ保存されていないものについて、公開APIから取得して反映する。
//    (spot_embedsテーブルにはUPDATE用のRLSポリシーがないため、対象の埋め込み行は
//    一旦削除してから同じ内容+取得したthumbnail_urlで再挿入する。
//    これはアプリ本体のupdateSpot()が投稿編集のたびに行っている処理と同じ)
//
// 使い方:
//   OFFICIAL_EMAIL="xxx@example.com" OFFICIAL_PASSWORD="xxxxxxxx" node scripts/seed/backfill-official-spots.mjs
//   まず対象を確認したい場合は --dry-run を付ける(削除・更新は行わず、対象一覧の出力のみ)
//   重複判定の距離しきい値(メートル)を変えたい場合は --dup-threshold=150 のように指定する(既定100m)

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

const dryRun = process.argv.includes('--dry-run');
const thresholdArg = process.argv.find((a) => a.startsWith('--dup-threshold='));
const DUP_THRESHOLD_M = thresholdArg ? Number(thresholdArg.split('=')[1]) : 100;

const API_BASE = 'https://limap.jp/api';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// 2点間の距離(メートル)をhaversine公式で計算する
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchEmbedThumbnail(platform, url) {
  try {
    const endpoint = platform === 'instagram' ? 'instagram-oembed' : 'x-oembed';
    const res = await fetch(`${API_BASE}/${endpoint}?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnailUrl ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('ログイン失敗:', signInError.message);
    process.exit(1);
  }
  const authorId = signInData.user.id;
  console.log(`ログイン成功 (author_id: ${authorId})${dryRun ? ' [dry-run]' : ''}\n`);

  const { data: spots, error } = await supabase
    .from('spots')
    .select(
      'id, slug, title, lat, lng, created_at, images:spot_images(storage_path), embeds:spot_embeds(id, platform, url, thumbnail_url, position)'
    )
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('取得失敗:', error.message);
    process.exit(1);
  }
  console.log(`公式アカウントの投稿 ${spots.length} 件を確認します。\n`);

  // --- 1) 重複登録の検出・削除 -------------------------------------------------
  // created_atが新しい順に並んでいるので、先に見つかったものを「残す代表」とし、
  // それに近い(=重複とみなせる)投稿は古い方なので削除対象にする。
  const kept = [];
  const toDelete = [];
  for (const spot of spots) {
    const dupOf = kept.find((k) => distanceMeters(k, spot) <= DUP_THRESHOLD_M);
    if (dupOf) {
      toDelete.push({ spot, dupOf });
    } else {
      kept.push(spot);
    }
  }

  if (toDelete.length > 0) {
    console.log(`=== 重複と判定した投稿(${DUP_THRESHOLD_M}m以内): ${toDelete.length}件 ===`);
    for (const { spot, dupOf } of toDelete) {
      console.log(
        `  削除対象: [${spot.title}] (/spot/${spot.slug}, ${spot.created_at}) ` +
          `-- 残す方: [${dupOf.title}] (/spot/${dupOf.slug}, ${dupOf.created_at})`
      );
    }
    console.log('');

    if (!dryRun) {
      for (const { spot } of toDelete) {
        const paths = (spot.images ?? []).map((img) => img.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('spot-images').remove(paths);
        }
        const { error: delError } = await supabase.from('spots').delete().eq('id', spot.id);
        if (delError) {
          console.error(`  削除失敗: ${spot.title} -`, delError.message);
        } else {
          console.log(`  削除しました: ${spot.title}`);
        }
      }
      console.log('');
    }
  } else {
    console.log('重複と判定される投稿はありませんでした。\n');
  }

  // --- 2) 埋め込みサムネイルの反映 ---------------------------------------------
  // 削除しなかった投稿(kept)のみを対象にする
  const targets = kept.filter((spot) => (spot.embeds ?? []).some((e) => !e.thumbnail_url));
  console.log(`=== 埋め込みサムネイル未反映の投稿: ${targets.length}件 ===`);

  let updated = 0;
  let noThumbnail = 0;
  let failed = 0;

  for (const [i, spot] of targets.entries()) {
    const label = `[${i + 1}/${targets.length}] ${spot.title} (/spot/${spot.slug})`;
    try {
      const embeds = spot.embeds.sort((a, b) => a.position - b.position);
      const thumbnails = await Promise.all(
        embeds.map((e) => (e.thumbnail_url ? Promise.resolve(e.thumbnail_url) : fetchEmbedThumbnail(e.platform, e.url)))
      );

      if (thumbnails.every((t, idx) => t === embeds[idx].thumbnail_url)) {
        noThumbnail++;
        console.log(`${label} - サムネイル取得できず(スキップ)`);
        continue;
      }

      if (dryRun) {
        console.log(`${label} - 更新予定 (${thumbnails.filter(Boolean).length}/${embeds.length}件のサムネイルを取得)`);
        updated++;
        continue;
      }

      const { error: delEmbedError } = await supabase.from('spot_embeds').delete().eq('spot_id', spot.id);
      if (delEmbedError) throw delEmbedError;

      const { error: insEmbedError } = await supabase.from('spot_embeds').insert(
        embeds.map((e, idx) => ({
          spot_id: spot.id,
          platform: e.platform,
          url: e.url,
          thumbnail_url: thumbnails[idx],
          position: e.position,
        }))
      );
      if (insEmbedError) throw insEmbedError;

      updated++;
      console.log(`${label} - 更新 (${thumbnails.filter(Boolean).length}/${embeds.length}件のサムネイルを反映)`);
    } catch (e) {
      failed++;
      console.error(`${label} - 失敗:`, e.message);
    }
  }

  console.log(
    `\n完了: 重複削除 ${toDelete.length} / サムネイル更新 ${updated} / 取得できず ${noThumbnail} / 失敗 ${failed}` +
      (dryRun ? ' (dry-run のため実際の削除・更新は行っていません)' : '')
  );
}

main();
