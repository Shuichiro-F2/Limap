// 記事データの整合性チェック（docs/article-publishing-workflow.md 参照）
// 使い方: node scripts/check-articles.js
const fs = require('fs');
const { categorySlugOf } = require('./article-categories');

const arts = JSON.parse(fs.readFileSync('content/articles.json', 'utf8'));
const src = fs.readFileSync('src/lib/articles.ts', 'utf8');
const start = src.indexOf('const ARTICLE_ENTRIES');
let block = src.slice(src.indexOf('[', start));
block = block.slice(0, block.indexOf('\n];') + 2);
const app = eval(block);

const jsonSlugs = arts.map((a) => a.slug);
const appSlugs = app.map((a) => a.slug);
const problems = [];

jsonSlugs.filter((s) => !appSlugs.includes(s)).forEach((s) => problems.push(`articles.ts に無い: ${s}`));
appSlugs.filter((s) => !jsonSlugs.includes(s)).forEach((s) => problems.push(`articles.json に無い: ${s}`));
// sitemap は npm run articles:build が書き出す src/content/articleIndex.json を読む
const index = fs.existsSync('src/content/articleIndex.json')
  ? JSON.parse(fs.readFileSync('src/content/articleIndex.json', 'utf8'))
  : { articles: [] };
const indexSlugs = index.articles.map((a) => a.slug);
jsonSlugs
  .filter((s) => !indexSlugs.includes(s))
  .forEach((s) => problems.push(`sitemap 用の一覧に無い（npm run articles:build）: ${s}`));

// カテゴリ・関連記事・SNS埋め込み
const X_STATUS_URL = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/[0-9]+/i;
const INSTAGRAM_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:p|reel|tv)\/[A-Za-z0-9_-]+/i;
for (const a of arts) {
  if (!categorySlugOf(a)) problems.push(`scripts/article-categories.js に無いカテゴリ: ${a.slug}（${a.category}）`);
  (a.related || [])
    .filter((s) => !jsonSlugs.includes(s))
    .forEach((s) => problems.push(`related に存在しない記事: ${a.slug} → ${s}`));
  for (const lang of ['ja', 'en']) {
    (a[lang].sections || []).forEach((sec, i) => {
      (sec.embeds || []).forEach((e) => {
        if (!X_STATUS_URL.test(e.url) && !INSTAGRAM_URL.test(e.url)) {
          problems.push(`埋め込みに使えないURL（X か Instagram の投稿のみ）: ${a.slug} ${lang} sections[${i}] ${e.url}`);
        }
        if (e.spot && !(sec.spots || []).some((sp) => sp.slug === e.spot)) {
          problems.push(`埋め込みの spot が同じセクションの spots に無い: ${a.slug} ${lang} sections[${i}] ${e.spot}`);
        }
      });
    });
  }
  // spots と同じく、埋め込みは ja・en の同じセクションに同じ投稿を入れる
  const urlsOf = (lang) => (a[lang].sections || []).map((sec) => (sec.embeds || []).map((e) => e.url).join(' '));
  const ja = urlsOf('ja');
  const en = urlsOf('en');
  ja.forEach((u, i) => {
    if (u !== (en[i] || '')) problems.push(`埋め込みが日英で食い違い: ${a.slug} sections[${i}]`);
  });
}
jsonSlugs
  .filter((s) => !fs.existsSync(`public/articles/${s}/index.html`))
  .forEach((s) => problems.push(`HTML未生成（npm run articles:build）: ${s}`));
jsonSlugs
  .filter((s) => !fs.existsSync(`public/en/articles/${s}/index.html`))
  .forEach((s) => problems.push(`英語版HTML未生成（npm run articles:build）: ${s}`));
const llms = fs.existsSync('public/llms.txt') ? fs.readFileSync('public/llms.txt', 'utf8') : '';
jsonSlugs
  .filter((s) => !llms.includes(`/articles/${s}/`))
  .forEach((s) => problems.push(`llms.txt に無い（npm run articles:build）: ${s}`));

// /japan とタグ別ページからリンクしている地方の記事（src/content/japan.ts の REGIONAL_ARTICLES）
const japan = fs.readFileSync('src/content/japan.ts', 'utf8');
const regionalBlock = japan.slice(japan.indexOf('REGIONAL_ARTICLES'), japan.indexOf('export function regionalArticlesFor'));
[...regionalBlock.matchAll(/slug: '([^']+)'/g)]
  .map((m) => m[1])
  .filter((s) => !jsonSlugs.includes(s))
  .forEach((s) => problems.push(`src/content/japan.ts の REGIONAL_ARTICLES にある記事が articles.json に無い: ${s}`));

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${jsonSlugs.length} 本すべて整合しています`);
