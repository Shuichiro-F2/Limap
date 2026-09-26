// 記事データ4箇所の整合性チェック（docs/article-publishing-workflow.md 参照）
// 使い方: node scripts/check-articles.js
const fs = require('fs');

const arts = JSON.parse(fs.readFileSync('content/articles.json', 'utf8'));
const src = fs.readFileSync('src/lib/articles.ts', 'utf8');
const start = src.indexOf('const ARTICLE_ENTRIES');
let block = src.slice(src.indexOf('[', start));
block = block.slice(0, block.indexOf('\n];') + 2);
const app = eval(block);
const sitemap = fs.readFileSync('api/sitemap.ts', 'utf8');

const jsonSlugs = arts.map((a) => a.slug);
const appSlugs = app.map((a) => a.slug);
const problems = [];

jsonSlugs.filter((s) => !appSlugs.includes(s)).forEach((s) => problems.push(`articles.ts に無い: ${s}`));
appSlugs.filter((s) => !jsonSlugs.includes(s)).forEach((s) => problems.push(`articles.json に無い: ${s}`));
jsonSlugs.filter((s) => !sitemap.includes(`'${s}'`)).forEach((s) => problems.push(`sitemap に無い: ${s}`));
jsonSlugs
  .filter((s) => !fs.existsSync(`public/articles/${s}/index.html`))
  .forEach((s) => problems.push(`HTML未生成（npm run articles:build）: ${s}`));
const llms = fs.existsSync('public/llms.txt') ? fs.readFileSync('public/llms.txt', 'utf8') : '';
jsonSlugs
  .filter((s) => !llms.includes(`/articles/${s}/`))
  .forEach((s) => problems.push(`llms.txt に無い（npm run articles:build）: ${s}`));

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${jsonSlugs.length} 本すべて整合しています`);
