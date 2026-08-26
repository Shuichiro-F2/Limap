// SEO記事一覧(記事タブ)用の軽量なデータ定義。
// 記事本文そのもの(content/articles.json)はサイト生成(scripts/generate-articles.js)専用で
// 分量が大きいため、アプリ側では一覧表示に必要な最小限の情報だけをここに持たせている。
// 記事を追加した場合は、ここと content/articles.json (本文) / api/sitemap.ts (ARTICLE_SLUGS) の
// 3箇所を合わせて更新する。
export interface ArticleSummary {
  slug: string;
  publishedDate: string;
  categoryJa: string;
  categoryEn: string;
  titleJa: string;
  titleEn: string;
  leadJa: string;
  leadEn: string;
  // Wikimedia Commonsのファイル名(サムネイル用)
  thumbnailFile: string;
}

export const ARTICLES: ArticleSummary[] = [
  {
    slug: 'what-is-liminal-space',
    publishedDate: '2026-08-15',
    categoryJa: '基礎知識',
    categoryEn: 'Basics',
    titleJa: 'リミナルスペースとは？意味・語源・具体例をわかりやすく解説',
    titleEn: 'What Is a Liminal Space? Meaning, Origin, and Real-World Examples',
    leadJa:
      'SNSで見かける「リミナルスペース」という言葉。なんとなく雰囲気は伝わるものの、正確な意味を説明できる人は意外と少ないかもしれません。',
    leadEn:
      'The term "liminal space" shows up constantly on social media. But what does it actually mean? This article breaks down the definition and origin.',
    thumbnailFile: 'Inevitable end of corridor (2098072225).jpg',
  },
  {
    slug: 'liminal-spaces-in-japan',
    publishedDate: '2026-08-15',
    categoryJa: '日本のリミナルスペース',
    categoryEn: 'Liminal Spaces in Japan',
    titleJa: '日本のリミナルスペースとは？特徴と代表的な場所の例',
    titleEn: 'Liminal Spaces in Japan: What Makes Them Different',
    leadJa:
      '鉄道網が発達し、24時間近く機能し続ける都市を持つ日本には、実は絶好のリミナルスペースが数多く存在します。',
    leadEn:
      'Japan — with its dense rail network and cities that run almost 24 hours a day — happens to be full of ideal liminal spaces.',
    thumbnailFile: 'Nara Dreamland.jpg',
  },
  {
    slug: 'liminal-space-vs-backrooms',
    publishedDate: '2026-08-15',
    categoryJa: '違いを知る',
    categoryEn: 'Comparisons',
    titleJa: 'リミナルスペースとバックルームの違いとは？',
    titleEn: "Liminal Space vs. the Backrooms: What's the Difference?",
    leadJa:
      '黄色い壁紙に蛍光灯、どこまでも続く廊下――見た目だけを見るとよく似ており、しばしば混同される2つの違いを解説します。',
    leadEn:
      "Yellow wallpaper, humming fluorescent lights, an endless hallway — liminal spaces and the Backrooms look alike, but they're fundamentally different.",
    thumbnailFile: 'HobbyTown USA Oshkosh interior under construction 2002 (The Backrooms).jpg',
  },
  {
    slug: 'liminal-space-vs-dreamcore',
    publishedDate: '2026-08-15',
    categoryJa: '違いを知る',
    categoryEn: 'Comparisons',
    titleJa: 'リミナルスペースとドリームコアの違いとは？',
    titleEn: 'Liminal Space vs. Dreamcore: What\'s the Difference?',
    leadJa:
      '「リミナルスペース」「ドリームコア」「ウィアードコア」。似ているようで違う3つのインターネット美学の違いを解説します。',
    leadEn:
      'Liminal space, dreamcore, and weirdcore all sit in similar territory online — here\'s a clear breakdown of what separates them.',
    thumbnailFile: 'Static on the playground (48616367).jpg',
  },
  {
    slug: 'why-liminal-spaces-feel-scary',
    publishedDate: '2026-08-15',
    categoryJa: '心理・雑学',
    categoryEn: 'Psychology',
    titleJa: 'なぜリミナルスペースに恐怖や不安を感じるのか',
    titleEn: 'Why Do Liminal Spaces Feel Scary or Unsettling?',
    leadJa:
      '誰もいないだけの場所なのに、なぜか怖い。その不思議な感覚の正体を、心理学の視点から整理します。',
    leadEn: "There's no monster in the photo, so why does it feel unsettling? Here's what psychology says.",
    thumbnailFile: 'IN Govt Center parking garage.JPG',
  },
  {
    slug: 'history-of-liminal-space-trend',
    publishedDate: '2026-08-15',
    categoryJa: '歴史・トレンド',
    categoryEn: 'History',
    titleJa: 'リミナルスペースはどう生まれ、なぜ流行したのか',
    titleEn: 'How Liminal Spaces Became a Trend: A Brief History',
    leadJa:
      '2019年のインターネット掲示板への1枚の投稿から始まり、コロナ禍を経て世界的なトレンドになった経緯を解説します。',
    leadEn:
      'From a single 2019 forum post to a worldwide phenomenon accelerated by the pandemic — the timeline of the trend.',
    thumbnailFile: 'Powell Street at Ellis Street, San Francisco, California, May 19, 2020.jpg',
  },
  {
    slug: 'how-to-find-liminal-spaces',
    publishedDate: '2026-08-15',
    categoryJa: '実践ガイド',
    categoryEn: 'Practical Guide',
    titleJa: 'リミナルスペースの見つけ方・撮り方のコツ',
    titleEn: 'How to Find and Photograph Liminal Spaces',
    leadJa:
      'いつも通っている場所の「時間帯」や「見る角度」を変えるだけで見つかることがほとんどです。見つけ方と撮り方のコツを紹介します。',
    leadEn:
      "Liminal spaces aren't hiding in some exotic location. Here's how to spot them nearby and photograph them well.",
    thumbnailFile: 'Vatican Museums Spiral Staircase 2012.jpg',
  },
  {
    slug: 'famous-liminal-spaces-around-the-world',
    publishedDate: '2026-08-15',
    categoryJa: '事例紹介',
    categoryEn: 'Examples',
    titleJa: '世界の有名なリミナルスペース事例',
    titleEn: 'Famous Liminal Spaces from Around the World',
    leadJa: '世界各地のよく話題に上がる代表的な事例を紹介しながら、それらに共通する特徴を整理します。',
    leadEn:
      'A look at the types of liminal spaces that keep going viral online, from dead malls to abandoned amusement parks.',
    thumbnailFile: 'Kaputte Dinosaurier Spreepark.JPG',
  },
  {
    slug: 'is-exit-8-real',
    publishedDate: '2026-08-26',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '「8番出口」は現実にあるのか？似た空気感の実在スポットを探す',
    titleEn: 'Is "Exit 8" Real? Looking for Actual Places With the Same Eerie Vibe',
    leadJa:
      '「本当に、あの光景と同じ場所があるんじゃないか」。ホラーゲーム・映画『8番出口』のような場所を、モデル駅探しではなく実例とともに紹介します。',
    leadEn:
      'Is there really a place like that? Instead of hunting for "the one station," we round up real places with the same Exit 8-like vibe.',
    thumbnailFile: 'University of Waterloo Underground Tunnel.jpg',
  },
  {
    slug: 'backrooms-in-japan',
    publishedDate: '2026-08-26',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: 'バックルームズは日本に実在する？「黄色い部屋」に近い空気の場所を探して',
    titleEn: 'Do the Backrooms Exist in Japan? Looking for Places With That "Yellow Room" Feeling',
    leadJa:
      '黄色い壁紙と蛍光灯の低い唸り音だけが響く、終わりのない部屋――「バックルームズ」は日本にも実在するのか。都市伝説としての成り立ちと、似た空気感を味わえる実在スポットを紹介します。',
    leadEn:
      'An endless maze of yellow-wallpapered rooms lit only by humming fluorescent tubes. Does anything like the Backrooms actually exist in Japan? We trace the legend and round up real places with a similar vibe.',
    thumbnailFile: 'HobbyTown USA Oshkosh interior under construction 2002 (The Backrooms).jpg',
  },
  {
    slug: 'not-haunted-just-eerie-spots',
    publishedDate: '2026-08-26',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '心霊スポットじゃない、「なんとなく怖い」不思議な場所の探し方',
    titleEn: 'Not a Haunted Spot, Just Eerie: How to Find "Strangely Unsettling" Places',
    leadJa:
      '心霊スポットは苦手。でも、廃墟や無人駅のような「なんとなく不思議な場所」には、なぜか心惹かれる。オカルト抜きで楽しめる不思議スポットの探し方と実例を紹介します。',
    leadEn:
      "Not into haunted spots, but still drawn to abandoned buildings and empty stations? Here's how to find \"strangely unsettling\" places worth visiting for the atmosphere alone — no occult required.",
    thumbnailFile: 'Quiet street - Kamakura, Kanagawa, Japan - DSC08370.JPG',
  },
  {
    slug: 'haikyo-photo-spots-japan',
    publishedDate: '2026-08-26',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '廃墟の撮影スポットを地図で探す。心霊目当てじゃない、日本各地の廃墟案内',
    titleEn: "Finding Abandoned Buildings on a Map: Japan's Ruins, Without the Haunted-House Angle",
    leadJa:
      '廃墟を撮りたい。でも、肝試しや心霊スポット巡りはしたくない。写真映えや建物そのものの迫力を楽しむための、日本各地の廃墟をLIMapの実例とともに紹介します。',
    leadEn:
      "Want to photograph abandoned buildings without the haunted-spot angle? Here's a guide to photogenic ruins across Japan, with real examples mapped on LIMap.",
    thumbnailFile: 'Battle-Ship Island Nagasaki Japan.jpg',
  },
];

// public/articles配下の静的ページ生成(scripts/generate-articles.js)と全く同じ組み立て方に揃えている
export function articleThumbnailUrl(file: string, width = 600): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function articleUrl(slug: string): string {
  return `https://limap.jp/articles/${slug}/`;
}
