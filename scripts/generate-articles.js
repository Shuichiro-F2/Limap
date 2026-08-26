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

function imageBlock(image, lang, variant) {
  if (!image) return '';
  const alt = lang === 'ja' ? image.altJa : image.altEn;
  const caption = lang === 'ja' ? image.captionJa : image.captionEn;
  const photoLabel = lang === 'ja' ? '写真' : 'Photo';
  const viaLabel = lang === 'ja' ? '出典' : 'Source';
  const figureClass = variant === 'hero' ? 'article-hero' : 'article-hero article-inline';
  return `      <figure class="${figureClass}">
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

// スポットカードのサムネイルが無い場合に表示する簡易ピンアイコン(インラインSVG)。
// LIMap公式アカウント経由で登録したスポットの多くは写真未添付のため、
// 画像が無くてもカードらしい見た目になるようプレースホルダーとして使う。
const SPOT_PIN_ICON =
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';

// セクション内でLIMapの実在スポットへ内部リンクを貼るためのブロック。
// 本文段落はescapeHtmlしているため<a>タグを直接埋め込めない。そのため、
// セクションのspots配列(各記事のja/en.sections[i].spots)に{title, slug}を
// 指定すると、タイムラインタブのカードに近い、サムネイル付きのカード形式で
// スポットへのリンクを並べて表示する。サムネイル画像が無いスポットは
// ピンアイコンのプレースホルダーで代替する。
function spotCardBlock(spots, lang) {
  if (!spots || spots.length === 0) return '';
  const label = lang === 'ja' ? '関連スポットを見る' : 'Related spots on LIMap';
  const items = spots
    .map((sp) => {
      const thumb = sp.thumbnailFile
        ? `<img class="spot-card-thumb" src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
            sp.thumbnailFile
          )}?width=400" alt="${escapeHtml(
            sp.title
          )}" loading="lazy" onerror="this.onerror=null;this.removeAttribute('src');this.classList.add('spot-card-thumb-empty');this.innerHTML='${SPOT_PIN_ICON.replace(/'/g, "\\'")}';" />`
        : `<div class="spot-card-thumb spot-card-thumb-empty">${SPOT_PIN_ICON}</div>`;
      return `          <a class="spot-card" href="${SITE_URL}/spot/${escapeHtml(sp.slug)}">
            ${thumb}
            <span class="spot-card-title">${escapeHtml(sp.title)}</span>
          </a>`;
    })
    .join('\n');
  return `\n        <div class="spot-cards">
          <span class="spot-cards-label">${label}</span>
${items}
        </div>`;
}

// 段落を出力しつつ、spots配列内の各要素が持つafterParagraph(0始まりの段落index)に従って、
// その段落の直後にスポットカードを差し込む。最後の段落の後で一括表示していた以前の形式から、
// 本文の関連する箇所にカードを挟み込む形式に変更している。afterParagraph未指定のスポットは
// 従来通り段落の末尾にまとめて表示する。
function langParagraphsWithSpots(paragraphs, spots, lang) {
  const spotsByParagraph = new Map();
  const trailingSpots = [];
  (spots || []).forEach((sp) => {
    if (typeof sp.afterParagraph === 'number') {
      const list = spotsByParagraph.get(sp.afterParagraph) || [];
      list.push(sp);
      spotsByParagraph.set(sp.afterParagraph, list);
    } else {
      trailingSpots.push(sp);
    }
  });
  const body = paragraphs
    .map((p, i) => {
      const pHtml = `        <p>${escapeHtml(p)}</p>`;
      const cardHtml = spotsByParagraph.has(i) ? spotCardBlock(spotsByParagraph.get(i), lang) : '';
      return pHtml + cardHtml;
    })
    .join('\n');
  return body + spotCardBlock(trailingSpots, lang);
}

// images配列のうち、指定セクションの直後(afterSection: 0始まりのセクション index)に
// 挿入する画像だけを取り出す。afterSection: -1 は「本文冒頭(=ヒーロー画像)」用に予約している。
function langSections(sections, images, lang) {
  const inlineImages = (images || []).filter((img) => img.afterSection >= 0);
  return sections
    .map((s, i) => {
      const imgHere = inlineImages.find((img) => img.afterSection === i);
      const imgHtml = imgHere ? '\n' + imageBlock(imgHere, lang, 'inline') : '';
      return `      <section class="article-section">
        <h2 class="section-heading">${escapeHtml(s.heading)}</h2>
${langParagraphsWithSpots(s.paragraphs, s.spots, lang)}
      </section>${imgHtml}`;
    })
    .join('\n');
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

function heroImageOf(article) {
  return (article.images || []).find((img) => img.afterSection === -1);
}

function cardThumbImg(image, lang) {
  if (!image) return '';
  const alt = lang === 'ja' ? image.altJa : image.altEn;
  return `<img class="card-thumb" src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    image.file
  )}?width=600" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.style.display='none'" />`;
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
            ${cardThumbImg(heroImageOf(a), lang)}
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
  const heroImage = (article.images || []).find((img) => img.afterSection === -1);
  return `    <div data-lang="${lang}">
      <span class="article-category">${escapeHtml(categoryLabel)}</span>
      <h1 class="article-title">${escapeHtml(content.h1)}</h1>
      <p class="article-meta">${dateLabel}</p>
      <p class="article-lead">${escapeHtml(content.lead)}</p>
${imageBlock(heroImage, lang, 'hero')}
${langSections(content.sections, article.images, lang)}
${ctaBlock(lang)}
${relatedBlock(article, all, lang)}
    </div>`;
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
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <title>${escapeHtml(ja.title)} | LIMap</title>
    <meta name="description" content="${escapeHtml(ja.metaDescription)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#16130f" />
    <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="manifest" href="${SITE_URL}/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="LIMap" />

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

${articleJsonLd(article)}
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
          ${cardThumbImg(heroImageOf(a), 'ja')}
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
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#16130f" />
    <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="icon" href="${SITE_URL}/apple-touch-icon.png" />
    <link rel="manifest" href="${SITE_URL}/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="LIMap" />

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
