// 公開中スポットのSNS埋め込み（X・Instagram）が、今も見られる状態かを点検する運用スクリプト。
// データは読むだけで、何も変更しない。
//
// 使い方:
//   node --env-file=.env scripts/check-embeds.mjs [出力先.csv]
//
// 判定方法:
// - X: 公式の oEmbed（publish.twitter.com/oembed）。削除・非公開・凍結された投稿は 404 などになる
// - Instagram: 公式の手段が無い（Meta の審査が必要）ため、この Mac の Google Chrome を画面なしで起動し、
//   埋め込み用ページ（/p/<ID>/embed/captioned/）を実際に開いて、「投稿が削除された可能性があります」
//   と出るかどうかで判定する。Instagram のページは JavaScript で組み立てられるため、ふつうの取得では区別できない
//
// 結果の見方（status 列）:
//   ok          見られる
//   unavailable 削除・非公開などで見られない
//   unknown     判定できなかった（通信エラー・Instagram の読み込みが遅いなど）。時間をおいて再実行する
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const outPath = process.argv[2] ?? 'embed-check.csv';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('SUPABASE_URL / SUPABASE_ANON_KEY がありません（node --env-file=.env で実行してください）');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchEmbeds() {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
  const select = 'id,platform,url,spot:spots!inner(slug,title,status,images:spot_images(id))';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spot_embeds?select=${select}&spot.status=eq.published&limit=5000`, {
    headers,
  });
  if (!res.ok) throw new Error(`埋め込みの取得に失敗しました: ${res.status}`);
  return res.json();
}

async function checkX(url) {
  try {
    const res = await fetch(`https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(url)}`);
    if (res.ok) return { status: 'ok', note: '' };
    if (res.status === 404 || res.status === 403) return { status: 'unavailable', note: `HTTP ${res.status}` };
    return { status: 'unknown', note: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'unknown', note: String(e.message ?? e) };
  }
}

// 画面なしの Chrome を1つ起動し、DevTools プロトコルでページを開いて中身を読む
async function startChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'limap-embed-check-'));
  const port = 9340 + Math.floor(Math.random() * 50);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], {
    stdio: 'ignore',
  });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
    } catch {}
  }
  if (!target) throw new Error('Chrome を起動できませんでした');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send('Page.enable');
  return {
    send,
    // Chrome が終わりきる前に作業フォルダを消すと失敗するため、終了を待ってから消す（消せなくても結果には影響しない）
    close: async () => {
      const exited = new Promise((r) => proc.once('exit', r));
      proc.kill();
      await Promise.race([exited, sleep(3000)]);
      try {
        fs.rmSync(profile, { recursive: true, force: true });
      } catch {}
    },
  };
}

const IG_URL = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i;
const IG_UNAVAILABLE = /(削除された可能性|isn't available|not available|may have been removed|broken)/i;

async function checkInstagram(chrome, url) {
  const m = url.match(IG_URL);
  if (!m) return { status: 'unavailable', note: 'URLの形式が不正' };
  const embedUrl = `https://www.instagram.com/${m[1]}/${m[2]}/embed/captioned/`;
  // 読み込みが遅いことがあるため、判定がつくまで少しずつ待つ（最大およそ12秒）
  await chrome.send('Page.navigate', { url: embedUrl });
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    const r = await chrome.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => ({
        text: document.body ? document.body.innerText.replace(/\\s+/g, ' ').slice(0, 300) : '',
        media: [...document.images].filter((img) => img.naturalWidth > 200).length + document.querySelectorAll('video').length,
      }))()`,
    });
    const v = r.result?.result?.value;
    if (!v) continue;
    if (IG_UNAVAILABLE.test(v.text)) return { status: 'unavailable', note: '削除・非公開の表示' };
    if (v.media > 0) return { status: 'ok', note: '' };
  }
  return { status: 'unknown', note: '時間内に判定できず' };
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const embeds = await fetchEmbeds();
console.log(`点検する埋め込み: ${embeds.length}件（X ${embeds.filter((e) => e.platform === 'x').length} / Instagram ${embeds.filter((e) => e.platform === 'instagram').length}）`);

const results = [];
let chrome = null;
for (const [i, e] of embeds.entries()) {
  let r;
  if (e.platform === 'x') {
    r = await checkX(e.url);
    await sleep(300);
  } else if (e.platform === 'instagram') {
    chrome ??= await startChrome();
    r = await checkInstagram(chrome, e.url);
  } else {
    r = { status: 'unknown', note: `未対応: ${e.platform}` };
  }
  results.push({ ...e, ...r });
  process.stdout.write(`\r${i + 1}/${embeds.length}`);
}
await chrome?.close();
process.stdout.write('\n');

// スポット単位で「写真も無く、見られる埋め込みが1つも無い」ものを、中身が空になったスポットとして印を付ける
const bySpot = new Map();
for (const r of results) {
  const key = r.spot.slug;
  if (!bySpot.has(key)) bySpot.set(key, []);
  bySpot.get(key).push(r);
}
const emptySpots = new Set(
  [...bySpot.entries()]
    .filter(([, rs]) => rs[0].spot.images.length === 0 && rs.every((r) => r.status === 'unavailable'))
    .map(([slug]) => slug)
);

const header = ['status', 'platform', 'spot_slug', 'spot_title', 'spot_has_photos', 'spot_left_empty', 'embed_url', 'note', 'spot_url'];
const lines = [header.join(',')];
for (const r of results.sort((a, b) => a.status.localeCompare(b.status) || a.platform.localeCompare(b.platform))) {
  lines.push(
    [
      r.status,
      r.platform,
      r.spot.slug,
      (r.spot.title ?? '').replace(/\s+/g, ' ').trim(),
      r.spot.images.length > 0 ? 'yes' : 'no',
      emptySpots.has(r.spot.slug) ? 'yes' : 'no',
      r.url,
      r.note,
      `https://limap.jp/spot/${r.spot.slug}`,
    ]
      .map(csvCell)
      .join(',')
  );
}
fs.writeFileSync(outPath, '﻿' + lines.join('\n') + '\n', 'utf8');

const count = (platform, status) => results.filter((r) => r.platform === platform && r.status === status).length;
console.log(`X:         見られる ${count('x', 'ok')} / 見られない ${count('x', 'unavailable')} / 判定できず ${count('x', 'unknown')}`);
console.log(
  `Instagram: 見られる ${count('instagram', 'ok')} / 見られない ${count('instagram', 'unavailable')} / 判定できず ${count('instagram', 'unknown')}`
);
console.log(`写真が無く、埋め込みもすべて見られなくなったスポット: ${emptySpots.size}件`);
console.log(`結果: ${outPath}`);
