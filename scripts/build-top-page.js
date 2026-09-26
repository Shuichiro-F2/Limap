#!/usr/bin/env node
/**
 * `npx expo export --platform web` の後に実行し、トップページ(/)の初期HTMLに本文を入れるスクリプト。
 *
 * 使い方: node scripts/build-top-page.js（vercel.json の buildCommand から呼ばれる）
 *
 * - dist/index.html は、Vercel 上で「/」にそのまま返される静的ファイル。
 *   ここの #root にサイト紹介・新着スポット・コラム記事・各ページへのリンクを入れ、
 *   JSを実行しないクローラーでも本文とリンクを読めるようにする。
 * - 一方で、SPAの各画面(vercel.json の rewrites)と api/spot.ts・api/page.ts は
 *   本文の入っていない「ひな形」が必要なため、元の dist/index.html を dist/app.html として残す。
 * - 存在しないURLに返す dist/404.html も、同じひな形から作る（Vercel が 404 ステータスで返す）。
 *   vercel.json の rewrites に画面のURLを書き漏らしても、ユーザーにはアプリがそのまま表示され、
 *   検索エンジンに登録されなくなるだけで済むようにするため。
 * - 新着スポットはビルド時点のもの（デプロイのたびに更新される）。
 *   Supabase に接続できない場合はその部分だけ省き、ビルドは止めない。
 *
 * 通常のブラウザでは、ロード画面(#limap-splash)が全面を覆っている間に React が
 * #root の中身を丸ごと置き換えるため、ユーザーの見た目は変わらない（api/spot.ts と同じ考え方）。
 */

const fs = require('fs');
const path = require('path');

try {
  // ローカル実行時は .env から読む（Vercel では環境変数が直接渡される）
  require('dotenv').config();
} catch {
  // dotenv が無くても process.env だけで動く
}

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const INDEX_PATH = path.join(DIST, 'index.html');
const SHELL_PATH = path.join(DIST, 'app.html');
const NOT_FOUND_PATH = path.join(DIST, '404.html');
const ARTICLES_PATH = path.join(ROOT, 'content', 'articles.json');

// src/lib/appStore.ts と同じURL（静的HTML側からアプリのコードを読めないため二重管理）
const APP_STORE_URL = 'https://apps.apple.com/jp/app/id6805902713';
const MAX_SPOTS = 30;
// src/content/tagPages.ts の MIN_SPOTS_FOR_TAG_PAGE と同じ値（JSからTSを読めないため二重管理）
const MIN_SPOTS_FOR_TAG_PAGE = 3;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchLatestSpots() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[build-top-page] SUPABASE_URL / SUPABASE_ANON_KEY が無いため、新着スポットは省きます');
    return [];
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/spots?select=slug,title,description&status=eq.published&order=created_at.desc&limit=${MAX_SPOTS}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[build-top-page] 新着スポットの取得に失敗したため省きます: ${e.message}`);
    return [];
  }
}

// タグ別ページ(/tags/<タグ名>)があるタグを、スポットの多い順に返す
async function fetchPageTags() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const counts = new Map();
    // PostgREST は1回最大1000行のため、offset で区切って全件を数える
    for (let offset = 0; ; offset += 1000) {
      const res = await fetch(
        `${url}/rest/v1/spot_tags?select=tag:tags(name),spot:spots!inner(status)&spot.status=eq.published&limit=1000&offset=${offset}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      for (const row of rows) {
        const name = row.tag && row.tag.name;
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      }
      if (rows.length < 1000) break;
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= MIN_SPOTS_FOR_TAG_PAGE)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  } catch (e) {
    console.warn(`[build-top-page] タグの集計に失敗したため省きます: ${e.message}`);
    return [];
  }
}

function loadArticles() {
  const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
  // 記事一覧と同じく公開日の新しい順
  return [...articles].sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1));
}

function spotTitle(spot) {
  // api/spot.ts の rawTitle と同じ決め方
  return (spot.title || '').trim() || (spot.description || '').trim().slice(0, 40) || '無題の投稿';
}

function buildBody(spots, articles, tags) {
  const parts = [];
  parts.push('<h1>LIMap（リマップ） | リミナルスペースを記録・共有する地図アプリ</h1>');
  parts.push(
    '<p>LIMapは、廃墟や無人駅、深夜の駐車場など「リミナルスペース」を写真と場所で記録・共有できる地図アプリです。' +
      '街や旅先に潜む不思議な空間を、みんなで見つけて地図に残しましょう。</p>'
  );
  parts.push(
    '<p lang="en">LIMap is a map for finding and sharing liminal spaces — abandoned buildings, empty stations, ' +
      'late-night parking lots and other eerie, nostalgic places — with photos and locations.</p>'
  );

  if (spots.length) {
    const items = spots
      .map((s) => `<li><a href="/spot/${encodeURIComponent(s.slug)}">${escapeHtml(spotTitle(s))}</a></li>`)
      .join('\n');
    parts.push(`<h2>新着のリミナルスペース / Latest spots</h2>\n<ul>\n${items}\n</ul>`);
  }

  if (tags.length) {
    const items = tags
      .map((t) => `<li><a href="/tags/${encodeURIComponent(t.name)}">#${escapeHtml(t.name)}</a>（${t.count}）</li>`)
      .join('\n');
    parts.push(
      `<h2>タグから探す / Browse by tag</h2>\n<ul>\n${items}\n</ul>\n<p><a href="/tags">タグ一覧 / All tags</a></p>`
    );
  }

  if (articles.length) {
    const items = articles
      .map((a) => `<li><a href="/articles/${encodeURIComponent(a.slug)}/">${escapeHtml(a.ja.title)}</a></li>`)
      .join('\n');
    parts.push(
      `<h2>コラム / Articles</h2>\n<ul>\n${items}\n</ul>\n<p><a href="/articles/">コラム一覧 / All articles</a></p>`
    );
  }

  parts.push(
    '<nav>' +
      [
        '<a href="/about">リミナルスペースとは / About</a>',
        '<a href="/help">使い方 / Help</a>',
        '<a href="/privacy">プライバシーポリシー / Privacy</a>',
        '<a href="/terms">利用規約 / Terms</a>',
        `<a href="${APP_STORE_URL}">iOSアプリ / iOS app</a>`,
      ].join(' ・ ') +
      '</nav>'
  );

  return `<main id="limap-ssr">\n${parts.join('\n')}\n</main>`;
}

async function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`${INDEX_PATH} がありません。先に npx expo export --platform web を実行してください`);
  }
  const shell = fs.readFileSync(INDEX_PATH, 'utf8');
  // 再実行しても壊れないよう、ひな形は常に本文の無い状態から作る
  if (shell.includes('id="limap-ssr"')) {
    throw new Error('dist/index.html に既に本文が入っています。expo export からやり直してください');
  }
  fs.writeFileSync(SHELL_PATH, shell);
  // 404ページは検索結果に出さない（ステータスでも伝わるが念のため明示する）
  fs.writeFileSync(
    NOT_FOUND_PATH,
    shell.replace('</head>', () => '  <meta name="robots" content="noindex" />\n  </head>')
  );

  const marker = '<div id="root"></div>';
  if (!shell.includes(marker)) {
    console.warn('[build-top-page] dist/index.html に <div id="root"></div> が見つからないため、本文は入れません');
    return;
  }

  const [spots, articles, tags] = await Promise.all([fetchLatestSpots(), Promise.resolve(loadArticles()), fetchPageTags()]);
  // 本文の見た目は public/index.html の #limap-ssr-style で指定している
  const html = shell.replace(marker, () => `<div id="root">${buildBody(spots, articles, tags)}</div>`);
  fs.writeFileSync(INDEX_PATH, html);
  console.log(
    `[build-top-page] トップページに本文を追加しました（新着スポット ${spots.length} 件・タグ ${tags.length} 個・記事 ${articles.length} 本）`
  );
}

main().catch((e) => {
  console.error(`[build-top-page] ${e.message}`);
  process.exit(1);
});
