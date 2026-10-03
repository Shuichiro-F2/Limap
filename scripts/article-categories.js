// 記事のカテゴリ（content/articles.json の category）と、カテゴリ別一覧ページのURL用スラッグの対応。
// generate-articles.js（ページ生成）と check-articles.js（整合性チェック）の両方から読む。
// 新しいカテゴリを使う記事を足したら、ここにも1行足す（無いと check-articles.js がエラーにする）。
const CATEGORY_SLUGS = {
  基礎知識: 'basics',
  日本のリミナルスペース: 'japan',
  違いを知る: 'comparisons',
  '心理・雑学': 'psychology',
  '歴史・トレンド': 'history',
  実践ガイド: 'guides',
  事例紹介: 'case-studies',
  実在スポット: 'real-spots',
  ゲーム: 'games',
};

// 記事が少ないカテゴリの一覧ページは中身が薄いため、検索結果に出さない（noindex・sitemapに載せない）
const MIN_ARTICLES_TO_INDEX = 3;

function categorySlugOf(article) {
  return CATEGORY_SLUGS[article.category];
}

// 一覧ページを検索エンジンに載せるカテゴリのスラッグ（api/sitemap.ts の ARTICLE_CATEGORY_SLUGS と一致させる）
function indexableCategorySlugs(articles) {
  const counts = {};
  for (const a of articles) {
    const slug = categorySlugOf(a);
    if (slug) counts[slug] = (counts[slug] || 0) + 1;
  }
  return Object.keys(counts).filter((slug) => counts[slug] >= MIN_ARTICLES_TO_INDEX);
}

module.exports = { CATEGORY_SLUGS, MIN_ARTICLES_TO_INDEX, categorySlugOf, indexableCategorySlugs };
