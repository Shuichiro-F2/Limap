#!/usr/bin/env node
/**
 * content/articles.json を元に、public/articles/<slug>/index.html と
 * public/articles/index.html（記事一覧ハブ）を静的HTMLとして生成するスクリプト。
 *
 * 使い方: node scripts/generate-articles.js
 *
 * 記事を追加・編集したいときは、content/articles.json にオブジェクトを
 * 追加・編集してから、このスクリプトを再実行してください。
 * 生成されたHTMLはExpoアプリとは独立しており、`npx expo export` 時に
 * public/ 配下のファイルとしてそのまま dist/ にコピーされます。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'content', 'articles.json');
const OUT_DIR = path.join(ROOT, 'public', 'articles');
const SITE_URL = 'https://limap.jp';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonLd(obj) {
  // </script> によるHTML解釈崩れを防ぐためのエスケープ
  return JSON.stringify(obj, null, 0).replace(/</g, '\\u003c');
}

function langParagraphs(paragraphs) {
  return paragraphs.map((p) => `        <p>${escapeHtml(p)}</p>`).join('\n');
}

function heroImageBlock(image, lang) {
  if (!image) return '';
  const alt = lang === 'ja' ? image.altJa : image.altEn;
  const caption = lang === 'ja' ? image.captionJa : image.captionEn;
  const photoLabel = lang === 'ja' ? '写真' : 'Photo';
  const viaLabel = lang === 'ja' ? '出典' : 'Source';
  return `      <figure class="article-hero">
        <img
          src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image.file)}?width=1200"
          alt="${escapeHtml(alt)}"
          loading="lazy"
          onerror="this.closest('figure').style.display='none'"
        />
        <figcaption>
          <span class="hero-caption-text">${escapeHtml(caption)}</span>
          <span class="hero-credit">${photoLabel}: ${escapeHtml(image.author)} (<a href="${escapeHtml(image.licenseUrl)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(image.license)}</a>), ${viaLabel}: <a href="${escapeHtml(image.sourceUrl)}" target="_blank" rel="noopener noreferrer nofollow">Wikimedia Commons</a></span>
        </figcaption>
      </figure>`;
}

function langSections(sections) {
  return sections
    .map(
      (s, i) => `      <section class="article-section">
        <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
${langParagraphs(s.paragraphs)}
      </section>`
    )
    .join('\n');
}

function faqBlock(faq, lang) {
  if (!faq || faq.length === 0) return '';
  const heading = lang === 'ja' ? 'よくある質問' : 'Frequently Asked Questions';
  const items = faq
    .map(
      (item) => `        <div class="faq-item">
          <p class="faq-q">${escapeHtml(item.q)}</p>
          <p class="faq-a">${escapeHtml(item.a)}</p>
        </div>`
    )
    .join('\n');
  return `      <div class="faq-block">
        <h2>${heading}</h2>
${items}
      </div>`;
}

function ctaBlock(lang) {
  if (lang === 'ja') {
    return `      <div class="cta-block">
        <h2>気になるリミナルスペースを見つけたら</h2>
        <p>写真と場所をLIMapに記録して、同じ感覚を持つ人たちと共有しましょう。</p>
        <a class="cta-button" href="${SITE_URL}/">LIMapで地図を見る</a>
      </div>`;
  }
  return `      <div class="cta-block">
        <h2>Found a liminal space of your own?</h2>
        <p>Record the photo and location on LIMap, and share it with people who feel the same pull toward these places.</p>
        <a class="cta-button" href="${SITE_URL}/">Open the LIMap map</a>
      </div>`;
}

function relatedBlock(current, all, lang) {
  const others = all.filter((a) => a.slug !== current.slug).slice(0, 4);
  if (others.length === 0) return '';
  const heading = lang === 'ja' ? 'こちらもおすすめ' : 'You Might Also Like';
  const items = others
    .map((a) => {
      const t = lang === 'ja' ? a.ja : a.en;
      const cat = lang === 'ja' ? a.category : a.categoryEn;
      return `          <a href="${SITE_URL}/articles/${a.slug}/">
            <span class="related-category">${escapeHtml(cat)}</span>
            <span class="related-item-title">${escapeHtml(t.h1)}</span>
          </a>`;
    })
    .join('\n');
  return `      <div class="related-block">
        <h2>${heading}</h2>
        <div class="related-list">
${items}
        </div>
      </div>`;
}

function langBlock(lang, article, all) {
  const content = article[lang];
  const categoryLabel = lang === 'ja' ? article.category : article.categoryEn;
  const dateLabel =
    lang === 'ja'
      ? `公開日: ${article.publishedDate}`
      : `Published: ${article.publishedDate}`;
  return `    <div data-lang="${lang}">
      <span class="article-category">${escapeHtml(categoryLabel)}</span>
      <h1 class="article-title">${escapeHtml(content.h1)}</h1>
      <p class="article-meta">${dateLabel}</p>
      <p class="article-lead">${escapeHtml(content.lead)}</p>
${heroImageBlock(article.image, lang)}
${langSections(content.sections)}
${faqBlock(content.faq, lang)}
${ctaBlock(lang)}
${relatedBlock(article, all, lang)}
    </div>`;
}

function faqJsonLd(article) {
  const faq = article.ja.faq;
  if (!faq || faq.length === 0) return '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  return `    <script type="application/ld+json">${escapeJsonLd(data)}</script>\n`;
}

function articleJsonLd(article) {
  const url = `${SITE_URL}/articles/${article.slug}/`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.ja.h1,
    description: article.ja.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    inLanguage: 'ja',
    url,
    image: `${SITE_URL}/og-image.png`,
    publisher: {
      '@type': 'Organization',
      name: 'LIMap',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/apple-touch-icon.png`,
    },
  };
  return `    <script type="application/ld+json">${escapeJsonLd(data)}</script>\n`;
}

function renderArticlePage(article, all) {
  const ja = article.ja;
  const url = `${SITE_URL}/articles/${article.slug}/`;

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>${escapeHtml(ja.title)} | LIMap</title>
    <meta name="description" content="${escapeHtml(ja.metaDescription)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#16130f" />
    <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="icon" href="${SITE_URL}/apple-touch-icon.png" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="LIMap" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(ja.title)}" />
    <meta property="og:description" content="${escapeHtml(ja.metaDescription)}" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta property="og:locale" content="ja_JP" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ja.title)}" />
    <meta name="twitter:description" content="${escapeHtml(ja.metaDescription)}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.png" />

${articleJsonLd(article)}${faqJsonLd(article)}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/articles/assets/article.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${SITE_URL}/">
        <img src="/articles/assets/logo-header.png" alt="LIMap" class="brand-logo" />
      </a>
      <div class="lang-switch">
        <button type="button" data-set-lang="ja">日本語</button>
        <button type="button" data-set-lang="en">English</button>
      </div>
    </header>

    <main>
      <article>
${langBlock('ja', article, all)}
${langBlock('en', article, all)}
      </article>
    </main>

    <footer class="site-footer">
      <a href="${SITE_URL}/">LIMapトップへ</a>
      <a href="${SITE_URL}/articles/">記事一覧</a>
      <a href="${SITE_URL}/about">リミナルスペースとは</a>
    </footer>

    <script src="/articles/assets/article.js"></script>
  </body>
</html>
`;
}

function renderHubPage(all) {
  const url = `${SITE_URL}/articles/`;
  const title = 'リミナルスペース読みもの | LIMap';
  const description =
    'リミナルスペースの意味や語源、バックルームズ・ドリームコアとの違い、日本での事例まで。LIMapがまとめる読みもの記事の一覧です。';

  const items = all
    .map(
      (a) => `        <a href="/articles/${a.slug}/">
          <span class="related-category">${escapeHtml(a.category)}</span>
          <p class="hub-item-title">${escapeHtml(a.ja.h1)}</p>
          <p class="hub-item-desc">${escapeHtml(a.ja.metaDescription)}</p>
        </a>`
    )
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    inLanguage: 'ja',
  };

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#16130f" />
    <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="icon" href="${SITE_URL}/apple-touch-icon.png" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LIMap" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta property="og:locale" content="ja_JP" />

    <script type="application/ld+json">${escapeJsonLd(jsonLd)}</script>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/articles/assets/article.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${SITE_URL}/">
        <img src="/articles/assets/logo-header.png" alt="LIMap" class="brand-logo" />
      </a>
    </header>

    <main>
      <h1 class="article-title">リミナルスペース読みもの</h1>
      <p class="hub-lead">リミナルスペースの意味や語源、似た言葉との違い、日本での事例まで。気になるテーマから読んでみてください。</p>
      <div class="hub-list">
${items}
      </div>
    </main>

    <footer class="site-footer">
      <a href="${SITE_URL}/">LIMapトップへ</a>
      <a href="${SITE_URL}/about">リミナルスペースとは</a>
    </footer>
  </body>
</html>
`;
}

function main() {
  const articles = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const article of articles) {
    const dir = path.join(OUT_DIR, article.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderArticlePage(article, articles), 'utf8');
    console.log('generated:', `public/articles/${article.slug}/index.html`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHubPage(articles), 'utf8');
  console.log('generated:', 'public/articles/index.html');

  // sitemap.tsで使う一覧をコンソールに出しておく（api/sitemap.tsへの反映は手動）
  console.log('\nslugs:', articles.map((a) => a.slug).join(', '));
}

main();
