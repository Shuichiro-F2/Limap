// Vercel Serverless Function
// 「日本のリミナルスペース一覧」（/japan）。vercel.json の rewrites で /api/japan にルーティングする。
//
// 「リミナルスペース 日本」「日本に実在するリミナルスペース」などの検索に答える柱ページ。
// 国内のスポットを都道府県ごとに並べ、都道府県・種類のタグ別ページ(api/tag.ts)と記事へつなぐ。
// DBから自動で作るため、投稿が増えれば中身も増える。
// 国内かどうかは都道府県タグで判定する（緯度経度だと韓国・北朝鮮のスポットが日本の範囲に重なるため）。
// そのため、都道府県タグの無い投稿はこのページに載らない。

import { createClient } from '@supabase/supabase-js';
import { JAPAN_PREFECTURES, JAPAN_REGIONS, prefectureFullName, regionalArticlesFor } from '../src/content/japan';
import {
  CHIP_STYLE,
  SITE_NAME,
  SITE_URL,
  breadcrumbJsonLd,
  escapeHtml,
  excerpt,
  renderPage,
  spotTitle,
  tagChips,
} from '../src/content/ssrPage';
import { MIN_SPOTS_FOR_TAG_PAGE, fetchAllRows, tagPagePath } from '../src/content/tagPages';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const PAGE_URL = `${SITE_URL}/japan`;

// 「種類から探す」に出さないタグ（地域・総称・国名など）
const NON_CATEGORY_TAGS = new Set(['リミナルスペース', '日本', '海外', ...JAPAN_PREFECTURES]);

// 関連する記事（content/articles.json のタイトル。記事のタイトルを変えたらここも合わせる）
const RELATED_ARTICLES: { slug: string; title: string }[] = [
  { slug: 'liminal-spaces-in-japan', title: '日本のリミナルスペースとは？特徴と代表的な場所の例' },
  { slug: 'backrooms-in-japan', title: 'バックルームズは日本に実在する？「黄色い部屋」に近い空気の場所を探して' },
  { slug: 'backrooms-spots-tokyo', title: '映画を観たあとに行きたい、東京の「バックルームズ的」な場所' },
  { slug: 'is-exit-8-real', title: '「8番出口」は現実にあるのか？似た空気感の実在スポットを探す' },
  { slug: 'haikyo-photo-spots-japan', title: '廃墟の撮影スポットを地図で探す。心霊目当てじゃない、日本各地の廃墟案内' },
  { slug: 'how-to-find-liminal-spaces', title: 'リミナルスペースの見つけ方・撮り方のコツ' },
];

type JapanSpot = {
  slug: string;
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  tags: { tag: { name: string } | { name: string }[] | null }[] | null;
};

function tagNamesOf(spot: JapanSpot): string[] {
  return (spot.tags || [])
    .map((row) => (Array.isArray(row.tag) ? row.tag[0]?.name : row.tag?.name))
    .filter((n): n is string => !!n);
}

const PAGE_STYLE = `      <style>
        .jp-stats { color: var(--text-secondary); font-size: 14px; margin: 0 0 20px; }
        .jp-region { margin-top: 36px; }
        .jp-pref { margin-top: 24px; }
        .jp-pref h3 { font-family: var(--font-heading); font-weight: 400; font-size: 17px; margin: 0 0 8px; }
        .jp-pref h3 a { color: var(--text-primary); }
        .jp-pref h3 span { color: var(--text-muted); font-size: 13px; font-weight: 400; margin-left: 6px; }
        .jp-spots { list-style: none; padding: 0; margin: 0; }
        .jp-spots li { padding: 8px 0; border-bottom: 1px solid var(--border); }
        .jp-spots a { color: var(--text-primary); }
        .jp-spots p { margin: 4px 0 0; font-size: 13.5px; color: var(--text-secondary); }
        .jp-faq dt { margin-top: 16px; font-weight: 700; }
        .jp-faq dd { margin: 6px 0 0; color: var(--text-secondary); }
        .jp-articles { margin: 0 0 8px; font-size: 14px; color: var(--text-secondary); }
        .jp-articles a { color: var(--accent); }
      </style>`;

function renderJapanPage(spots: JapanSpot[], tagPageCounts: Map<string, number>): string {
  // 都道府県ごとに振り分ける（県境のスポットは両方に載る）
  const byPref = new Map<string, JapanSpot[]>();
  for (const s of spots) {
    for (const pref of tagNamesOf(s).filter((n) => JAPAN_PREFECTURES.includes(n))) {
      (byPref.get(pref) ?? byPref.set(pref, []).get(pref)!).push(s);
    }
  }
  for (const list of byPref.values()) list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const total = spots.length;
  const prefCount = byPref.size;
  const lastUpdated = spots.reduce((max, s) => (s.updated_at > max ? s.updated_at : max), '').slice(0, 10);
  const topPrefs = [...byPref.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3);

  // 種類のタグ（国内スポットでの件数。タグ別ページがあるものだけ）
  const categoryCounts = new Map<string, number>();
  for (const s of spots) {
    for (const n of tagNamesOf(s)) if (!NON_CATEGORY_TAGS.has(n)) categoryCounts.set(n, (categoryCounts.get(n) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()]
    .filter(([name]) => (tagPageCounts.get(name) ?? 0) >= MIN_SPOTS_FOR_TAG_PAGE)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  // 都道府県のリンクはページ内の一覧へ飛ばす（2件以下の県にはタグ別ページが無いため。3件以上の県は一覧の見出しからタグ別ページへ行ける）
  const prefChips = JAPAN_PREFECTURES.filter((p) => byPref.has(p))
    .map((p) => `<a class="tag-chip" href="#pref-${escapeHtml(p)}">${escapeHtml(p)}<span>${byPref.get(p)!.length}</span></a>`)
    .join('\n');

  const regionSections = JAPAN_REGIONS.map(({ region, prefectures }) => {
    const prefs = prefectures.filter((p) => byPref.has(p));
    if (prefs.length === 0) return '';
    const prefBlocks = prefs
      .map((p) => {
        const list = byPref.get(p)!;
        const heading =
          (tagPageCounts.get(p) ?? 0) >= MIN_SPOTS_FOR_TAG_PAGE
            ? `<a href="${tagPagePath(p)}">${prefectureFullName(p)}</a>`
            : prefectureFullName(p);
        const items = list
          .map(
            (s) =>
              `          <li><a href="/spot/${encodeURIComponent(s.slug)}">${escapeHtml(spotTitle(s))}</a>${
                s.description ? `<p>${escapeHtml(excerpt(s.description, 70))}</p>` : ''
              }</li>`
          )
          .join('\n');
        return `        <section class="jp-pref" id="pref-${escapeHtml(p)}">
          <h3>${heading}<span>${list.length}件</span></h3>
          <ul class="jp-spots">
${items}
          </ul>
        </section>`;
      })
      .join('\n');
    const articles = regionalArticlesFor(prefectures);
    const articleLine = articles.length
      ? `        <p class="jp-articles">この地方の記事：${articles
          .map((a) => `<a href="/articles/${a.slug}/">${escapeHtml(a.label)}</a>`)
          .join('、')}</p>\n`
      : '';
    return `      <section class="jp-region">
        <h2 class="section-heading">${region}</h2>
${articleLine}${prefBlocks}
      </section>`;
  }).join('\n');

  const topPrefText = topPrefs.map(([p, list]) => `${prefectureFullName(p)}（${list.length}件）`).join('、');
  const faq = [
    {
      q: '日本にリミナルスペースはありますか？',
      a: `あります。廃墟や地下通路、無人駅、団地、閉店後の商業施設など、日本各地にリミナルスペースと呼べる場所が数多くあります。LIMapには現在、国内${prefCount}都道府県の${total}か所が登録されています。`,
    },
    {
      q: '日本のリミナルスペースはどこに多いですか？',
      a: `LIMapに登録されている範囲では、${topPrefText}が多くなっています。都市部の地下通路や駅だけでなく、地方の鉱山跡や廃線跡、温泉街の廃ホテルなどにも独特の空気の場所があります。`,
    },
    {
      q: 'リミナルスペースを見に行くときの注意点は？',
      a: '私有地や立入禁止の場所には入らないでください。廃墟の多くは老朽化していて危険です。外から眺める、公開されている施設や見学ツアーを利用するなど、安全とマナーを守って訪れてください。',
    },
  ];

  const title = `日本のリミナルスペース一覧（${total}か所・都道府県別） | ${SITE_NAME}`;
  const description = excerpt(
    `日本に実在するリミナルスペース${total}か所を都道府県別に一覧で紹介。${topPrefs
      .map(([p]) => prefectureFullName(p))
      .join('・')}など${prefCount}都道府県の廃墟、地下通路、無人駅、団地、鉱山跡などを、写真と地図で探せます。`,
    120
  );

  const body = `${CHIP_STYLE}
${PAGE_STYLE}
      <span class="article-category">日本 / Japan</span>
      <h1 class="article-title">日本のリミナルスペース一覧</h1>
      <p class="hub-lead">リミナルスペースとは、人の気配が消えた、どこか不気味で懐かしい「境界」の空間のこと。このページでは、LIMapに登録された日本国内のリミナルスペースを都道府県別に一覧できます。廃墟、地下通路、無人駅、団地、鉱山跡、廃ホテルなど、実在する場所だけを集めています。</p>
      <p class="hub-lead" lang="en">A list of real liminal spaces in Japan by prefecture: abandoned buildings, underground passages, empty stations, housing complexes and more.</p>
      <p class="jp-stats">${prefCount}都道府県・${total}か所（最終更新: <time datetime="${lastUpdated}">${lastUpdated}</time>）</p>

      <h2 class="section-heading">都道府県から探す</h2>
      <div class="tag-chips">
${prefChips}
      </div>

      <h2 class="section-heading">種類から探す</h2>
      <div class="tag-chips">
${tagChips(categories)}
      </div>

${regionSections}

      <section class="jp-region">
        <h2 class="section-heading">よくある質問</h2>
        <dl class="jp-faq">
${faq.map((f) => `          <dt>${escapeHtml(f.q)}</dt><dd>${escapeHtml(f.a)}</dd>`).join('\n')}
        </dl>
      </section>

      <section class="jp-region">
        <h2 class="section-heading">日本のリミナルスペース・バックルームズに関する記事</h2>
        <ul>
${RELATED_ARTICLES.map((a) => `          <li><a href="/articles/${a.slug}/">${escapeHtml(a.title)}</a></li>`).join('\n')}
        </ul>
      </section>

      <p class="tag-cta"><a href="${SITE_URL}/create">知っている場所を投稿する / Add a place you know</a> ・ <a href="${SITE_URL}/">LIMapの地図でリミナルスペースを探す / Explore the map</a></p>`;

  return renderPage({
    title,
    description,
    url: PAGE_URL,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: PAGE_URL,
        inLanguage: 'ja',
        dateModified: lastUpdated,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: total,
          itemListElement: spots.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/spot/${s.slug}`,
            name: spotTitle(s),
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      breadcrumbJsonLd([
        { name: 'LIMap', url: `${SITE_URL}/` },
        { name: '日本のリミナルスペース一覧', url: PAGE_URL },
      ]),
    ],
  });
}

export default async function handler(_req: any, res: any) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase is not configured');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const all = await fetchAllRows<JapanSpot>((from, to) =>
      supabase
        .from('spots')
        .select('slug, title, description, created_at, updated_at, tags:spot_tags(tag:tags(name))')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to)
    );

    // タグ別ページがあるかの判定用に、全公開スポットでのタグの件数を数える
    const tagPageCounts = new Map<string, number>();
    for (const s of all) for (const n of new Set(tagNamesOf(s))) tagPageCounts.set(n, (tagPageCounts.get(n) ?? 0) + 1);

    const domestic = all.filter((s) => tagNamesOf(s).some((n) => JAPAN_PREFECTURES.includes(n)));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=2592000');
    res.status(200).send(renderJapanPage(domestic, tagPageCounts));
  } catch {
    res.status(500).send('Internal Server Error');
  }
}
