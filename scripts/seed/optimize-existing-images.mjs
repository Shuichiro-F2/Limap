// 既にアップロード済みの投稿画像を、軽量化(縮小+WebP変換+サムネイル生成)するための
// メンテナンススクリプト。
//
// 背景: アプリ本体は今回、投稿時に画像を縮小・WebP変換し、グリッド/カード表示専用の
// 小さいサムネイルも別途生成するように変更したが、これは「今後アップロードする画像」
// にしか効かない。投稿数の多いアカウント(公式アカウントなど)が既に登録している
// 大きな画像はそのままなので、プロフィール画面などで大量の高解像度画像を同時に
// デコードすることになり、動作が重くなる(再読み込みが繰り返される)原因になっていた。
// このスクリプトは、指定したアカウントが投稿した既存の全画像を対象に、同じ変換を
// 事後的に適用する。
//
// 動作:
// - 対象アカウントが投稿した全スポットの画像を取得する。
// - storage_pathが既に.webpで、thumbnail_pathも設定済みの画像はスキップする
//   (再実行しても重複処理されない)。
// - それ以外の画像は、現在のファイルをダウンロードしてsharpで縮小・WebP変換し、
//   フル画像・サムネイルを新しいパスにアップロードしたうえで、spot_imagesの
//   storage_path/thumbnail_pathを新しいパスに更新する。
// - 更新後、不要になった旧ファイルをStorageから削除する(失敗しても処理は続行する)。
//
// 使い方（このリポジトリのルートで、通常のネット接続がある環境で実行すること）:
//   OWNER_EMAIL="xxx@example.com" OWNER_PASSWORD="xxxxxxxx" node scripts/seed/optimize-existing-images.mjs
//
// 注意:
// - このスクリプトが最適化できるのは、ログインしたアカウント自身が投稿した画像のみ
//   (RLSにより他人の投稿は更新できない)。投稿数の多い別アカウントについては、
//   そのアカウントの認証情報でこのスクリプトを実行する必要がある。
// - 実行前に、0011_spot_images_storage_delete_policy.sql のマイグレーションを
//   適用しておくこと(旧ファイルの削除に必要)。未適用でも削除だけ失敗し、
//   画像自体の最適化は継続される。

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import sharp from 'sharp';

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

const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
if (!email || !password) {
  console.error('環境変数 OWNER_EMAIL / OWNER_PASSWORD を指定してください(最適化したい投稿の投稿者アカウント)');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// アプリ本体(src/lib/imageResize.ts)・add-spot-images.mjsと揃えた設定
const FULL_MAX_DIMENSION = 1600;
const FULL_QUALITY = 75;
const THUMBNAIL_MAX_DIMENSION = 640;
const THUMBNAIL_QUALITY = 60;

async function toWebp(buffer, maxDimension, quality) {
  return await sharp(buffer)
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

function isAlreadyOptimized(image) {
  return !!image.thumbnail_path && image.storage_path.toLowerCase().endsWith('.webp');
}

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('ログイン失敗:', signInError.message);
    process.exit(1);
  }
  const authorId = signInData.user.id;
  console.log(`ログイン成功 (author_id: ${authorId})`);

  const { data: spots, error: spotsError } = await supabase
    .from('spots')
    .select('id, images:spot_images(id, storage_path, thumbnail_path)')
    .eq('author_id', authorId);
  if (spotsError) {
    console.error('スポット取得失敗:', spotsError.message);
    process.exit(1);
  }

  const targets = (spots ?? []).flatMap((spot) => (spot.images ?? []).map((image) => ({ spotId: spot.id, image })));
  console.log(`対象画像候補: ${targets.length}件\n`);

  let optimized = 0;
  let skipped = 0;
  let failed = 0;

  for (const [i, { spotId, image }] of targets.entries()) {
    const label = `[${i + 1}/${targets.length}] spot=${spotId} image=${image.id}`;

    if (isAlreadyOptimized(image)) {
      skipped++;
      console.log(`${label} - skip (対応済み)`);
      continue;
    }

    try {
      const { data: blob, error: downloadError } = await supabase.storage.from('spot-images').download(image.storage_path);
      if (downloadError) throw downloadError;
      const rawBuffer = Buffer.from(await blob.arrayBuffer());

      const [fullBuffer, thumbBuffer] = await Promise.all([
        toWebp(rawBuffer, FULL_MAX_DIMENSION, FULL_QUALITY),
        toWebp(rawBuffer, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY),
      ]);

      const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newStoragePath = `${authorId}/${uid}.webp`;
      const newThumbnailPath = `${authorId}/${uid}-thumb.webp`;

      const { error: uploadError } = await supabase.storage
        .from('spot-images')
        .upload(newStoragePath, fullBuffer, { contentType: 'image/webp', upsert: false });
      if (uploadError) throw uploadError;

      const { error: thumbUploadError } = await supabase.storage
        .from('spot-images')
        .upload(newThumbnailPath, thumbBuffer, { contentType: 'image/webp', upsert: false });
      if (thumbUploadError) throw thumbUploadError;

      const { error: updateError } = await supabase
        .from('spot_images')
        .update({ storage_path: newStoragePath, thumbnail_path: newThumbnailPath })
        .eq('id', image.id);
      if (updateError) throw updateError;

      // 参照が新しいパスに切り替わった後、不要になった旧ファイルを削除する。
      // (0011のマイグレーション未適用など、権限的に削除できない場合もあるが、
      // 画像自体の最適化は既に完了しているため失敗しても処理は続行する)
      const oldPaths = [image.storage_path, image.thumbnail_path].filter(Boolean);
      const { error: removeError } = await supabase.storage.from('spot-images').remove(oldPaths);
      if (removeError) {
        console.warn(`${label} - 旧ファイル削除エラー(最適化自体は完了):`, removeError.message);
      }

      optimized++;
      console.log(`${label} - 完了`);
    } catch (e) {
      failed++;
      console.error(`${label} - 失敗:`, e.message);
    }
  }

  console.log(`\n完了: 最適化 ${optimized} / スキップ(対応済み) ${skipped} / 失敗 ${failed}`);
}

main();
