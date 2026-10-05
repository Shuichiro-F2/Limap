#!/usr/bin/env node
/**
 * content/articles.json を元に、記事ページと記事一覧ハブを静的HTMLとして生成するスクリプト。
 *   日本語版: public/articles/<slug>/index.html、public/articles/index.html
 *   英語版:   public/en/articles/<slug>/index.html、public/en/articles/index.html
 * 日英は別URLにして hreflang で結び、あわせて AI 向けの案内 public/llms.txt も生成する。
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
const { categorySlugOf, indexableCategorySlugs } = require('./article-categories');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'content', 'articles.json');
const OUT_DIR = path.join(ROOT, 'public', 'articles');
const OUT_DIR_EN = path.join(ROOT, 'public', 'en', 'articles');
// 生成物。api/sitemap.ts が読む（手で編集しない）
const ARTICLE_INDEX_PATH = path.join(ROOT, 'src', 'content', 'articleIndex.json');
const SITE_URL = 'https://limap.jp';
// iOSアプリのApp Storeページ。src/lib/appStore.ts と同じURLを指す
// (記事ページはReactアプリとは別の静的HTMLのため、定数を共有できず二重管理になる。
//  App IDを変える場合は両方を更新すること)。
const APP_STORE_URL = 'https://apps.apple.com/jp/app/id6805902713';
// Ko-fi(投げ銭)のページ。src/lib/support.ts と同じURLを指す(二重管理)。
// 記事ページはWeb専用の静的HTMLなので、iOSアプリ内に表示されることはない。
const KOFI_URL = 'https://ko-fi.com/limap';

// iOS向けApp Store誘導バナー。
// アプリ本体(src/components/AppStoreBanner.tsx)と同じ構成・同じ文言・同じ
// localStorageキーで動く。既定はhiddenで、iOS端末のブラウザで開いたときだけ
// article.js側が表示する(非iOS端末で一瞬ちらつくのを避けるため)。
// 文言はページの言語（日本語版 /articles/、英語版 /en/articles/）に合わせて出し分ける。
function appBannerBlock(lang) {
  const ja = lang !== 'en';
  return `    <aside class="app-banner" id="app-banner" hidden>
      <button type="button" class="app-banner-close" id="app-banner-close" aria-label="${ja ? '閉じる' : 'Close'}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <img src="${SITE_URL}/apple-touch-icon.png" alt="" class="app-banner-icon" />
      <div class="app-banner-text">
        <p class="app-banner-title">LIMap</p>
        <p class="app-banner-subtitle">${ja ? 'App Storeでアプリを入手' : 'Get the app on the App Store'}</p>
      </div>
      <a class="app-banner-action" href="${APP_STORE_URL}" target="_blank" rel="noopener">${ja ? '入手' : 'Get'}</a>
    </aside>`;
}

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

const SPOT_PIN_ICON_SMALL =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';

// セクション内でLIMapの実在スポットへ内部リンクを貼るためのブロック。
// 本文段落はescapeHtmlしているため<a>タグを直接埋め込めない。そのため、
// セクションのspots配列(各記事のja/en.sections[i].spots)に{title, slug}を
// 指定すると、タイムラインタブ/プロフィールタブと同じ考え方(spotThumbnailUrl:
// 投稿写真があればそれ、無ければ埋め込んだSNS投稿(X/Instagram)のサムネイルを使う)で
// 事前に解決したthumbnailUrlを使い、サムネイル付きのカード形式でスポットへの
// リンクを並べて表示する。サムネイルが無い(SNS埋め込みにも写真が無い)スポットや
// 画像の読み込みに失敗した場合は、article.js側のonerrorハンドラでピンアイコンの
// プレースホルダーに差し替える。
function spotCardBlock(spots, lang) {
  if (!spots || spots.length === 0) return '';
  const label = lang === 'ja' ? '関連スポットを見る' : 'Related spots on LIMap';
  const items = spots
    .map((sp) => {
      const thumb = sp.thumbnailUrl
        ? `<img class="spot-card-thumb" src="${escapeHtml(sp.thumbnailUrl)}" alt="${escapeHtml(
            sp.title
          )}" loading="lazy" onerror="window.__limapSpotThumbFallback(this)" />`
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

// SNS投稿（X・Instagram）の埋め込み。記事に使える自前の写真が少ないため、スポットの投稿と同じく
// 公式の埋め込みで写真を見せる（画像を複製せず、投稿者の表示・元の投稿へのリンクも残る）。
// JS無しや読み込み前は「Xで投稿を見る」のリンクだけが出て、article.js が画面に近づいたときに
// 公式スクリプト（widgets.js / embed.js）を読み込んで投稿の表示に置き換える。
// sections[].embeds = [{ url, afterParagraph?, caption?, spot? }]（spots と同じく ja・en の両方に書く）
// spot（同じセクションの spots にあるスラッグ）を付けると、投稿の下にそのスポットのページへのリンクを出し、
// 同じ写真が二重に並ばないよう、そのスポットのカードは出さない。
const X_STATUS_URL = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/([0-9]+)/i;
// 投稿者名の入った形（instagram.com/<ユーザー名>/p/<コード>/）もある
const INSTAGRAM_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i;

function parseEmbedUrl(url) {
  const x = String(url).match(X_STATUS_URL);
  if (x) return { platform: 'x', user: x[1], id: x[2] };
  const ig = String(url).match(INSTAGRAM_URL);
  if (ig) return { platform: 'instagram', kind: ig[1], code: ig[2] };
  return null;
}

function embedBlock(embed, lang, spot) {
  const parsed = parseEmbedUrl(embed.url);
  if (!parsed) throw new Error(`埋め込みに使えないURLです（X か Instagram の投稿URLのみ）: ${embed.url}`);
  const spotLink = spot
    ? `<a class="sns-embed-spot" href="${SITE_URL}/spot/${escapeHtml(spot.slug)}">${SPOT_PIN_ICON_SMALL}${escapeHtml(spot.title)}${
        lang === 'ja' ? ' をLIMapで見る' : ' on LIMap'
      } →</a>`
    : '';
  const captionText = embed.caption ? escapeHtml(embed.caption) : '';
  const caption =
    spotLink || captionText
      ? `\n          <figcaption>${captionText}${captionText && spotLink ? '<br />' : ''}${spotLink}</figcaption>`
      : '';
  if (parsed.platform === 'x') {
    // widgets.js はブロック内のリンクから投稿IDを読む。twitter.com の形にしておくと確実に認識される
    const href = `https://twitter.com/${parsed.user}/status/${parsed.id}`;
    const label = lang === 'ja' ? 'Xで投稿を見る' : 'View the post on X';
    return `\n        <figure class="sns-embed" data-platform="x">
          <blockquote class="twitter-tweet" data-dnt="true" data-theme="dark" data-lang="${lang}"><a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${label} ↗</a></blockquote>${caption}
        </figure>`;
  }
  const permalink = `https://www.instagram.com/${parsed.kind}/${parsed.code}/`;
  const label = lang === 'ja' ? 'Instagramで投稿を見る' : 'View the post on Instagram';
  return `\n        <figure class="sns-embed" data-platform="instagram">
          <blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14"><a href="${permalink}" target="_blank" rel="noopener noreferrer nofollow">${label} ↗</a></blockquote>${caption}
        </figure>`;
}

// afterParagraph（0始まりの段落index）ごとにまとめる。未指定のものは段落の末尾に回す
function groupByParagraph(items) {
  const byParagraph = new Map();
  const trailing = [];
  (items || []).forEach((item) => {
    if (typeof item.afterParagraph === 'number') {
      const list = byParagraph.get(item.afterParagraph) || [];
      list.push(item);
      byParagraph.set(item.afterParagraph, list);
    } else {
      trailing.push(item);
    }
  });
  return { byParagraph, trailing };
}

// 段落を出力しつつ、spots・embeds の各要素が持つ afterParagraph に従って、その段落の直後に
// スポットカード・SNS投稿の埋め込みを差し込む（同じ段落ならカード→埋め込みの順）。
// afterParagraph 未指定のものはセクションの末尾にまとめて表示する。
function langParagraphsWithSpots(paragraphs, spots, embeds, lang) {
  const spotBySlug = new Map((spots || []).map((sp) => [sp.slug, sp]));
  const embeddedSpots = new Set((embeds || []).map((e) => e.spot).filter(Boolean));
  const spotGroups = groupByParagraph((spots || []).filter((sp) => !embeddedSpots.has(sp.slug)));
  const embedGroups = groupByParagraph(embeds);
  const embedsHtml = (list) => (list || []).map((e) => embedBlock(e, lang, e.spot && spotBySlug.get(e.spot))).join('');
  const body = paragraphs
    .map((p, i) => {
      const pHtml = `        <p>${escapeHtml(p)}</p>`;
      const cardHtml = spotGroups.byParagraph.has(i) ? spotCardBlock(spotGroups.byParagraph.get(i), lang) : '';
      return pHtml + cardHtml + embedsHtml(embedGroups.byParagraph.get(i));
    })
    .join('\n');
  return body + spotCardBlock(spotGroups.trailing, lang) + embedsHtml(embedGroups.trailing);
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
${langParagraphsWithSpots(s.paragraphs, s.spots, s.embeds, lang)}
      </section>${imgHtml}`;
    })
    .join('\n');
}

function ctaBlock(lang) {
  if (lang === 'ja') {
    return `      <div class="cta-block">
        <h2>気になるリミナルスペースを見つけたら</h2>
        <p>写真と場所をLIMapに記録して、同じ感覚を持つ人たちと共有しましょう。写真の代わりに、XやInstagramに投稿した写真のURLでも登録できます。</p>
        <a class="cta-button" href="${SITE_URL}/create">場所を投稿する</a>
        <a class="cta-sub" href="${SITE_URL}/">LIMapで地図を見る</a>
      </div>`;
  }
  return `      <div class="cta-block">
        <h2>Found a liminal space of your own?</h2>
        <p>Record the photo and location on LIMap, and share it with people who feel the same pull toward these places. Instead of uploading a photo, you can also use the URL of a photo you posted on X or Instagram.</p>
        <a class="cta-button" href="${SITE_URL}/create">Add a place</a>
        <a class="cta-sub" href="${SITE_URL}/">Open the LIMap map</a>
      </div>`;
}

// 記事末尾の控えめな支援リンク。CTA(地図への誘導)より目立たせないよう、テキスト主体にしている。
function supportBlock(lang) {
  if (lang === 'ja') {
    return `      <p class="support-note">
        この記事が、あなたの知らない場所への入口になっていれば幸いです。<br />
        <a href="${KOFI_URL}" target="_blank" rel="noopener">LIMapの運営を支援する（Ko-fi）→</a>
      </p>`;
  }
  return `      <p class="support-note">
        If this article opened a door to somewhere new,<br />
        <a href="${KOFI_URL}" target="_blank" rel="noopener">you can support LIMap on Ko-fi →</a>
      </p>`;
}

function heroImageOf(article) {
  return (article.images || []).find((img) => img.afterSection === -1);
}

function commonsImageUrl(image, width) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image.file)}?width=${width}`;
}

// 最終更新日。本文を直したときは articles.json の updatedDate を更新する（無ければ公開日）
function modifiedDateOf(article) {
  return article.updatedDate || article.publishedDate;
}

// 「よくある質問」。articles.json の ja.faq / en.faq（{ q, a } の配列）を本文の末尾に出す。
// 同じ内容を FAQPage の構造化データとしても出すため、ページ上の表示と必ず一致させること。
function faqBlock(faq, lang) {
  if (!faq || faq.length === 0) return '';
  const heading = lang === 'ja' ? 'よくある質問' : 'FAQ';
  const items = faq
    .map(
      (item) => `        <div class="faq-item">
          <h3 class="faq-question">${escapeHtml(item.q)}</h3>
          <p>${escapeHtml(item.a)}</p>
        </div>`
    )
    .join('\n');
  return `      <section class="article-section faq-section">
        <h2 class="section-heading">${heading}</h2>
${items}
      </section>`;
}

function cardThumbImg(image, lang) {
  if (!image) return '';
  const alt = lang === 'ja' ? image.altJa : image.altEn;
  return `<img class="card-thumb" src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    image.file
  )}?width=600" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.style.display='none'" />`;
}

// 記事一覧・関連記事の1行（小さな写真＋カテゴリ＋タイトル）。アプリのコラムタブの一覧と同じ構成
function columnRow(article, lang, href) {
  const t = lang === 'ja' ? article.ja : article.en;
  const cat = lang === 'ja' ? article.category : article.categoryEn;
  return `          <a class="col-row" href="${href}">
            ${cardThumbImg(heroImageOf(article), lang)}
            <span class="col-row-body">
              <span class="col-kicker">${escapeHtml(cat)}</span>
              <span class="col-row-title">${escapeHtml(t.h1)}</span>
            </span>
          </a>`;
}

// 記事一覧の先頭に置く、最新記事の大きなカード
function columnFeatured(article, lang, href) {
  const t = lang === 'ja' ? article.ja : article.en;
  const cat = lang === 'ja' ? article.category : article.categoryEn;
  const hero = heroImageOf(article);
  const img = hero
    ? `<img class="col-featured-img" src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
        hero.file
      )}?width=1200" alt="${escapeHtml(lang === 'ja' ? hero.altJa : hero.altEn)}" onerror="this.style.display='none'" />`
    : '';
  return `        <a class="col-featured" href="${href}">
          ${img}
          <span class="col-featured-body">
            <span class="col-kicker">${escapeHtml(cat)}・${article.publishedDate}</span>
            <span class="col-featured-title">${escapeHtml(t.h1)}</span>
            <span class="col-featured-desc">${escapeHtml(t.metaDescription)}</span>
          </span>
        </a>`;
}

// ---- 言語ごとのURL ----
// 日本語版は /articles/<slug>/、英語版は /en/articles/<slug>/。
// 以前は1つのURLに日英の本文を両方入れてJSで切り替えていたが、英語の検索で評価されるよう、
// 言語ごとに別のページとして出力し、hreflang で互いを別言語版として示す。
function articlePath(slug, lang) {
  return lang === 'en' ? `/en/articles/${slug}/` : `/articles/${slug}/`;
}

function hubPath(lang) {
  return lang === 'en' ? '/en/articles/' : '/articles/';
}

// カテゴリ別の記事一覧（/articles/category/<slug>/）
function categoryPath(slug, lang) {
  return `${hubPath(lang)}category/${slug}/`;
}

// RSS（/articles/feed.xml・/en/articles/feed.xml）
function feedPath(lang) {
  return `${hubPath(lang)}feed.xml`;
}

function feedLink(lang) {
  const title = lang === 'ja' ? 'LIMap 読みもの' : 'LIMap Articles';
  return `    <link rel="alternate" type="application/rss+xml" title="${title}" href="${SITE_URL}${feedPath(lang)}" />\n`;
}

// hreflang（x-default は日本語版）
function hreflangLinks(jaPath, enPath) {
  return `    <link rel="alternate" hreflang="ja" href="${SITE_URL}${jaPath}" />
    <link rel="alternate" hreflang="en" href="${SITE_URL}${enPath}" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${jaPath}" />
`;
}

// 言語の切り替え: 表示中の言語はボタン風の表示、もう一方は相手のURLへのリンク
function langSwitch(lang, jaPath, enPath) {
  const item = (code, label, href) =>
    code === lang
      ? `<span class="active" aria-current="true">${label}</span>`
      : `<a href="${href}" hreflang="${code}" lang="${code}">${label}</a>`;
  return `      <nav class="lang-switch" aria-label="Language">
        ${item('ja', '日本語', jaPath)}
        ${item('en', 'English', enPath)}
      </nav>`;
}

// 記事・一覧ページ共通の <head> 内のフォント・CSS（キャッシュの古いJS/CSSを使わないよう版番号を付ける）
const ASSET_VERSION = '5';

function fontAndStyleLinks() {
  return `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=DotGothic16&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/articles/assets/article.css?v=${ASSET_VERSION}" />`;
}

function siteFooter(lang) {
  if (lang === 'en') {
    return `    <footer class="site-footer">
      <a href="${SITE_URL}/">LIMap home</a>
      <a href="${SITE_URL}${hubPath('en')}">All articles</a>
      <a href="${SITE_URL}/japan">Liminal spaces in Japan</a>
    </footer>`;
  }
  return `    <footer class="site-footer">
      <a href="${SITE_URL}/">LIMapトップへ</a>
      <a href="${SITE_URL}${hubPath('ja')}">記事一覧</a>
      <a href="${SITE_URL}/about">リミナルスペースとは</a>
      <a href="${SITE_URL}/japan">日本のリミナルスペース一覧</a>
    </footer>`;
}

// 関連記事に「同じシリーズ」として寄せるための、スラッグに含まれる語（地方記事・バックルームズ関連など）
const SERIES_TOKENS = ['liminal-spots-', 'backrooms', 'exit-8', 'pool', 'game', 'haikyo', 'noclip', 'kane-pixels'];
// どの記事からも1本はリンクする、入口になる基礎の記事
const PILLAR_SLUG = 'what-is-liminal-space';
const RELATED_COUNT = 4;

// 関連記事の選び方：articles.json の related（スラッグの配列）があればそれを先に、
// 残りは「同じシリーズ」「同じカテゴリ」を優先し、同点なら新しい順。
// 最後の1枠は、基礎の記事（リミナルスペースとは）が入っていなければそれにする。
function relatedArticles(current, all) {
  const bySlug = new Map(all.map((a) => [a.slug, a]));
  const picked = (current.related || []).map((slug) => bySlug.get(slug)).filter(Boolean);
  const tokensOf = (a) => SERIES_TOKENS.filter((t) => a.slug.includes(t));
  const currentTokens = tokensOf(current);
  const score = (a) =>
    (tokensOf(a).some((t) => currentTokens.includes(t)) ? 2 : 0) + (a.category === current.category ? 1 : 0);
  // all は新しい順に並んでいるので、安定ソートで同点は新しい順のまま
  const rest = all
    .filter((a) => a.slug !== current.slug && !picked.includes(a))
    .map((a) => ({ a, s: score(a) }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);
  let list = [...picked, ...rest].slice(0, RELATED_COUNT);
  const pillar = bySlug.get(PILLAR_SLUG);
  if (pillar && current.slug !== PILLAR_SLUG && !list.includes(pillar)) {
    list = [...list.slice(0, RELATED_COUNT - 1), pillar];
  }
  return list;
}

function relatedBlock(current, all, lang) {
  const others = relatedArticles(current, all);
  if (others.length === 0) return '';
  const heading = lang === 'ja' ? 'こちらもおすすめ' : 'You Might Also Like';
  const items = others.map((a) => columnRow(a, lang, `${SITE_URL}${articlePath(a.slug, lang)}`)).join('\n');
  return `      <div class="related-block">
        <h2>${heading}</h2>
        <div class="col-list">
${items}
        </div>
      </div>`;
}

function langBlock(lang, article, all) {
  const content = article[lang];
  const categoryLabel = lang === 'ja' ? article.category : article.categoryEn;
  const updated = article.updatedDate && article.updatedDate !== article.publishedDate ? article.updatedDate : null;
  const dateLabel =
    lang === 'ja'
      ? `公開日: ${article.publishedDate}${updated ? ` ／ 更新日: ${updated}` : ''}`
      : `Published: ${article.publishedDate}${updated ? ` / Updated: ${updated}` : ''}`;
  const heroImage = (article.images || []).find((img) => img.afterSection === -1);
  return `    <div class="article-body">
      <a class="article-category" href="${categoryPath(categorySlugOf(article), lang)}">${escapeHtml(categoryLabel)}</a>
      <h1 class="article-title">${escapeHtml(content.h1)}</h1>
      <p class="article-meta">${dateLabel}</p>
      <p class="article-lead">${escapeHtml(content.lead)}</p>
${imageBlock(heroImage, lang, 'hero')}
${langSections(content.sections, article.images, lang)}
${faqBlock(content.faq, lang)}
${ctaBlock(lang)}
${supportBlock(lang)}
${relatedBlock(article, all, lang)}
    </div>`;
}

function articleJsonLd(article, lang) {
  const content = article[lang];
  const url = `${SITE_URL}${articlePath(article.slug, lang)}`;
  const hero = heroImageOf(article);
  const organization = {
    '@type': 'Organization',
    name: 'LIMap',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/apple-touch-icon.png`,
  };
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.h1,
    description: content.metaDescription,
    datePublished: article.publishedDate,
    dateModified: modifiedDateOf(article),
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    image: hero ? commonsImageUrl(hero, 1200) : `${SITE_URL}/og-image.png`,
    // 記事はLIMap運営が編集しているため、著者・発行元ともに組織とする
    author: organization,
    publisher: organization,
  };
  let out = `    <script type="application/ld+json">${escapeJsonLd(data)}</script>\n`;

  // ページに表示しているFAQと同じ内容（faqBlock参照）
  const faq = content.faq || [];
  if (faq.length > 0) {
    const faqData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
    out += `    <script type="application/ld+json">${escapeJsonLd(faqData)}</script>\n`;
  }
  return out;
}

function renderArticlePage(article, all, lang) {
  const content = article[lang];
  const jaPath = articlePath(article.slug, 'ja');
  const enPath = articlePath(article.slug, 'en');
  const url = `${SITE_URL}${articlePath(article.slug, lang)}`;
  const hero = heroImageOf(article);
  const ogImage = hero ? commonsImageUrl(hero, 1200) : `${SITE_URL}/og-image.png`;

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <title>${escapeHtml(content.title)} | LIMap</title>
    <meta name="description" content="${escapeHtml(content.metaDescription)}" />
    <meta name="robots" content="max-image-preview:large" />
    <link rel="canonical" href="${url}" />
${hreflangLinks(jaPath, enPath)}${feedLink(lang)}    <meta name="theme-color" content="#1a1a1a" />
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
    <meta property="og:title" content="${escapeHtml(content.title)}" />
    <meta property="og:description" content="${escapeHtml(content.metaDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ja_JP'}" />
    <meta property="og:locale:alternate" content="${lang === 'en' ? 'ja_JP' : 'en_US'}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(content.title)}" />
    <meta name="twitter:description" content="${escapeHtml(content.metaDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

${articleJsonLd(article, lang)}${fontAndStyleLinks()}
  </head>
  <body>
${appBannerBlock(lang)}
    <header class="site-header">
      <a class="brand" href="${SITE_URL}/">
        <img src="/articles/assets/logo-header.png" alt="LIMap" class="brand-logo" />
      </a>
${langSwitch(lang, jaPath, enPath)}
    </header>

    <main>
      <article>
${langBlock(lang, article, all)}
      </article>
    </main>

${siteFooter(lang)}

    <script src="/articles/assets/article.js?v=${ASSET_VERSION}"></script>
  </body>
</html>
`;
}

const HUB_TEXT = {
  ja: {
    title: 'リミナルスペース読みもの | LIMap',
    description:
      'リミナルスペースの意味や語源、バックルームズ・ドリームコアとの違い、日本での事例まで。LIMapがまとめる読みもの記事の一覧です。',
    h1: 'リミナルスペース読みもの',
    lead: 'リミナルスペースの意味や語源、似た言葉との違い、日本での事例まで。気になるテーマから読んでみてください。',
  },
  en: {
    title: 'Reading on Liminal Spaces | LIMap',
    description:
      'What liminal spaces are, where the word comes from, how they differ from the Backrooms and dreamcore, and real examples in Japan. Articles by LIMap.',
    h1: 'Reading on Liminal Spaces',
    lead: 'What liminal spaces mean, where the idea comes from, how it differs from similar terms, and real examples in Japan. Start with whatever catches your eye.',
  },
};

// 一覧の上に並べるカテゴリの切り替え（すべて＋各カテゴリ）。記事の多い順
function categoryNav(all, lang, activeSlug) {
  const counts = new Map();
  for (const a of all) {
    const slug = categorySlugOf(a);
    const entry = counts.get(slug) || { slug, label: lang === 'ja' ? a.category : a.categoryEn, count: 0 };
    entry.count += 1;
    counts.set(slug, entry);
  }
  const cats = [...counts.values()].sort((x, y) => y.count - x.count);
  const item = (href, label, active) =>
    active
      ? `<span class="cat-chip active" aria-current="page">${escapeHtml(label)}</span>`
      : `<a class="cat-chip" href="${href}">${escapeHtml(label)}</a>`;
  const allLabel = lang === 'ja' ? 'すべて' : 'All';
  return `      <nav class="cat-nav" aria-label="${lang === 'ja' ? 'カテゴリ' : 'Categories'}">
        ${item(hubPath(lang), allLabel, !activeSlug)}
${cats.map((c) => `        ${item(categoryPath(c.slug, lang), c.label, c.slug === activeSlug)}`).join('\n')}
      </nav>`;
}

// 記事一覧ページ（全記事の一覧・カテゴリ別の一覧の共通部分）
function renderListPage({ all, list, lang, text, path, jaPath, enPath, activeCategory, noindex, featured }) {
  const url = `${SITE_URL}${path}`;
  // 全記事の一覧は、最新の1本を大きな写真付きで目立たせ、残りは細い線で区切った一覧にする（アプリのコラムタブと同じ）
  const [first, ...rest] = featured ? list : [null, ...list];
  const featuredHtml = first ? columnFeatured(first, lang, articlePath(first.slug, lang)) + '\n' : '';
  const items = rest.map((a) => columnRow(a, lang, articlePath(a.slug, lang))).join('\n');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: text.title,
    description: text.description,
    url,
    inLanguage: lang,
  };
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <title>${escapeHtml(text.title)}</title>
    <meta name="description" content="${escapeHtml(text.description)}" />
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'max-image-preview:large'}" />
    <link rel="canonical" href="${url}" />
${hreflangLinks(jaPath, enPath)}${feedLink(lang)}    <meta name="theme-color" content="#1a1a1a" />
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
    <meta property="og:title" content="${escapeHtml(text.title)}" />
    <meta property="og:description" content="${escapeHtml(text.description)}" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ja_JP'}" />
    <script type="application/ld+json">${escapeJsonLd(jsonLd)}</script>
${fontAndStyleLinks()}
  </head>
  <body>
${appBannerBlock(lang)}
    <header class="site-header">
      <a class="brand" href="${SITE_URL}/">
        <img src="/articles/assets/logo-header.png" alt="LIMap" class="brand-logo" />
      </a>
${langSwitch(lang, jaPath, enPath)}
    </header>

    <main>
      <h1 class="article-title">${escapeHtml(text.h1)}</h1>
      <p class="hub-lead">${escapeHtml(text.lead)}</p>
${categoryNav(all, lang, activeCategory)}
${featuredHtml}      <div class="col-list hub-col-list">
${items}
      </div>
    </main>

${siteFooter(lang)}

    <script src="/articles/assets/article.js?v=${ASSET_VERSION}"></script>
  </body>
</html>
`;
}

function renderHubPage(all, lang) {
  return renderListPage({
    all,
    list: all,
    lang,
    text: HUB_TEXT[lang],
    path: hubPath(lang),
    jaPath: hubPath('ja'),
    enPath: hubPath('en'),
    featured: true,
  });
}

function renderCategoryPage(all, slug, lang, indexable) {
  const list = all.filter((a) => categorySlugOf(a) === slug);
  const label = lang === 'ja' ? list[0].category : list[0].categoryEn;
  const text =
    lang === 'ja'
      ? {
          title: `${label}の記事一覧 | LIMap`,
          description: `LIMapの読みもののうち、「${label}」の記事${list.length}本の一覧です。リミナルスペースやバックルームズ、日本に実在する場所について。`,
          h1: `${label}`,
          lead: `「${label}」の記事${list.length}本。新しい順に並んでいます。`,
        }
      : {
          title: `${label} | LIMap Articles`,
          description: `${list.length} LIMap article${list.length === 1 ? '' : 's'} in "${label}": liminal spaces, the Backrooms, and real places in Japan.`,
          h1: `${label}`,
          lead: `${list.length} article${list.length === 1 ? '' : 's'} in this category, newest first.`,
        };
  return renderListPage({
    all,
    list,
    lang,
    text,
    path: categoryPath(slug, lang),
    jaPath: categoryPath(slug, 'ja'),
    enPath: categoryPath(slug, 'en'),
    activeCategory: slug,
    noindex: !indexable,
    featured: false,
  });
}

// RSS 2.0。新しい順に最大30本
function rfc822(date) {
  return new Date(`${date}T09:00:00+09:00`).toUTCString();
}

function renderFeed(all, lang) {
  const text = HUB_TEXT[lang];
  const items = all
    .slice(0, 30)
    .map((a) => {
      const t = a[lang];
      const link = `${SITE_URL}${articlePath(a.slug, lang)}`;
      return `    <item>
      <title>${escapeHtml(t.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(a.publishedDate)}</pubDate>
      <category>${escapeHtml(lang === 'ja' ? a.category : a.categoryEn)}</category>
      <description>${escapeHtml(t.metaDescription)}</description>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(lang === 'ja' ? 'LIMap 読みもの' : 'LIMap Articles')}</title>
    <link>${SITE_URL}${hubPath(lang)}</link>
    <atom:link href="${SITE_URL}${feedPath(lang)}" rel="self" type="application/rss+xml" />
    <description>${escapeHtml(text.description)}</description>
    <language>${lang}</language>
    <lastBuildDate>${rfc822(all[0].updatedDate && all[0].updatedDate > all[0].publishedDate ? all[0].updatedDate : all[0].publishedDate)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// AI向けのサイト案内（https://llmstxt.org/ の形式）。public/llms.txt として出力する。
// 記事一覧は articles.json から作るため、記事を追加して articles:build すれば自動で更新される。
// サイトの説明文を変えるときは、トップページ(scripts/build-top-page.js)・about と食い違わないようにする。
function renderLlmsTxt(all) {
  const articleLines = all
    .map((a) => `- [${a.ja.title}](${SITE_URL}/articles/${a.slug}/): ${a.ja.metaDescription}`)
    .join('\n');
  const articleLinesEn = all
    .map((a) => `- [${a.en.title}](${SITE_URL}/en/articles/${a.slug}/): ${a.en.metaDescription}`)
    .join('\n');
  return `# LIMap（リマップ）

> LIMap は、リミナルスペース（人の気配が消えた、どこか不気味で懐かしい場所）を写真と位置情報で地図に記録・共有するサービスです。Web 版（${SITE_URL}/）と iOS アプリがあり、日本語と英語に対応しています。

- 廃墟、無人駅、深夜の駐車場、地下通路、閉店後の商業施設などのリミナルスペースを、ユーザーと LIMap 運営が地図に登録しています。日本各地のほか海外のスポットもあります。
- 各スポットのページ（${SITE_URL}/spot/<ID>）には、写真、説明、アクセス、おすすめの訪問時間帯、タグ、近くのスポットが載っています。
- 地図の閲覧と検索はログインなしで使えます。投稿・いいね・行きたい場所への保存・フォローには無料のアカウント登録が必要です。
- 私有地や立入禁止区域への立ち入りを助長する投稿は利用規約で禁止しています。

## 主なページ

- [トップ（地図）](${SITE_URL}/): 登録されたリミナルスペースを地図で探せるトップページ。新着スポットとコラム記事への入口
- [リミナルスペースとは](${SITE_URL}/about): リミナルスペースの意味・特徴・日本の実例と、よくある質問
- [LIMapの使い方](${SITE_URL}/help): 地図での探し方、投稿、いいね・行きたい場所、フォロー機能
- [日本のリミナルスペース一覧](${SITE_URL}/japan): 日本に実在するリミナルスペースを都道府県別に一覧できるページ（投稿が増えると自動で更新）
- [タグから探す](${SITE_URL}/tags): 廃工場・駅・団地・廃校など、タグ別のスポット一覧（投稿が増えると自動で更新）
- [コラム一覧](${SITE_URL}/articles/): リミナルスペースやバックルームズに関する読みもの
- [iOSアプリ](${APP_STORE_URL}): App Store の LIMap

## コラム記事

${articleLines}

## English

LIMap is a map for finding and sharing liminal spaces: abandoned buildings, empty stations, late-night parking lots and other eerie, nostalgic places. English versions of the articles are at ${SITE_URL}/en/articles/ (each page links to its Japanese version with hreflang).

${articleLinesEn}

## Optional

- [サイトマップ](${SITE_URL}/sitemap.xml): すべてのスポットページ・記事・主なページの一覧
- [プライバシーポリシー](${SITE_URL}/privacy)
- [利用規約](${SITE_URL}/terms)
`;
}

function main() {
  // 記事一覧ハブ・関連記事ブロックともに新着順(publishedDateの降順)で並べる。
  // Array#sortは安定なので、同じ公開日の記事はarticles.jsonに書いた順のまま。
  // src/lib/articles.ts(アプリのコラムタブ)の並び順と揃えてある。
  const articles = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')).sort((a, b) =>
    b.publishedDate.localeCompare(a.publishedDate)
  );
  const unknown = articles.filter((a) => !categorySlugOf(a)).map((a) => `${a.slug}（${a.category}）`);
  if (unknown.length) {
    throw new Error(`scripts/article-categories.js の CATEGORY_SLUGS に無いカテゴリです: ${unknown.join(', ')}`);
  }

  // 日本語版は public/articles/、英語版は public/en/articles/ に出力する
  for (const lang of ['ja', 'en']) {
    const outDir = lang === 'en' ? OUT_DIR_EN : OUT_DIR;
    fs.mkdirSync(outDir, { recursive: true });
    for (const article of articles) {
      const dir = path.join(outDir, article.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), renderArticlePage(article, articles, lang), 'utf8');
      console.log('generated:', path.relative(ROOT, path.join(dir, 'index.html')));
    }
    fs.writeFileSync(path.join(outDir, 'index.html'), renderHubPage(articles, lang), 'utf8');
    console.log('generated:', path.relative(ROOT, path.join(outDir, 'index.html')));

    // カテゴリ別の一覧。前回の生成で残った、今は使っていないカテゴリのページは消す
    const categoryDir = path.join(outDir, 'category');
    fs.rmSync(categoryDir, { recursive: true, force: true });
    const indexable = indexableCategorySlugs(articles);
    for (const slug of new Set(articles.map(categorySlugOf))) {
      const dir = path.join(categoryDir, slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), renderCategoryPage(articles, slug, lang, indexable.includes(slug)), 'utf8');
      console.log('generated:', path.relative(ROOT, path.join(dir, 'index.html')));
    }

    fs.writeFileSync(path.join(outDir, 'feed.xml'), renderFeed(articles, lang), 'utf8');
    console.log('generated:', path.relative(ROOT, path.join(outDir, 'feed.xml')));
  }

  fs.writeFileSync(path.join(ROOT, 'public', 'llms.txt'), renderLlmsTxt(articles), 'utf8');
  console.log('generated:', 'public/llms.txt');

  // sitemap（api/sitemap.ts）が読む記事とカテゴリの一覧。記事を足して articles:build すれば sitemap にも載る
  // スポットページ（api/spot.ts）の「このスポットが出てくる記事」用：スポットのスラッグ → 記事（新しい順）
  const spotArticles = {};
  for (const a of articles) {
    const slugs = new Set(a.ja.sections.flatMap((s) => (s.spots || []).map((sp) => sp.slug)));
    for (const slug of slugs) (spotArticles[slug] = spotArticles[slug] || []).push(a.slug);
  }
  const index = {
    articles: articles.map((a) => ({ slug: a.slug, lastmod: modifiedDateOf(a), titleJa: a.ja.h1, titleEn: a.en.h1 })),
    spotArticles,
    categories: indexableCategorySlugs(articles).map((slug) => ({
      slug,
      lastmod: articles
        .filter((a) => categorySlugOf(a) === slug)
        .map(modifiedDateOf)
        .sort()
        .pop(),
    })),
  };
  fs.writeFileSync(ARTICLE_INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log('generated:', path.relative(ROOT, ARTICLE_INDEX_PATH));


}

main();
