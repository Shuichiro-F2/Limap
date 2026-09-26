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

const ARTICLE_ENTRIES: ArticleSummary[] = [
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
  {
    slug: 'backrooms-movie-guide',
    publishedDate: '2026-09-04',
    categoryJa: '歴史・トレンド',
    categoryEn: 'History',
    titleJa: '映画『バックルームズ』に予習は必要？元ネタ・原作YouTube・監督を公開日にまとめる',
    titleEn:
      'Do You Need to Do Homework Before Watching Backrooms? The Legend, the YouTube Series, and the Director',
    leadJa:
      '2026年9月4日、映画『バックルームズ』が日本公開。予習は必要なのか——その答えとあわせて、4chan発の都市伝説としての歴史、原作となったYouTubeシリーズ、20歳でA24デビューした監督の経歴を整理しました。',
    leadEn:
      'Backrooms opened in Japan on September 4, 2026. Do you need to prepare before seeing it? Here is the short answer, plus the 4chan legend, the YouTube series it is based on, and the director who debuted with A24 at twenty.',
    thumbnailFile:
      'Dsc00159.jpg_Bức_ảnh_thứ_2_trong_2_bức_ảnh_nguồn_gốc_của_The_Backrooms.jpg',
  },
  {
    slug: 'is-backrooms-movie-scary',
    publishedDate: '2026-09-06',
    categoryJa: '心理・雑学',
    categoryEn: 'Psychology',
    titleJa: '映画『バックルームズ』は怖い？ネタバレなしで、怖さの種類を説明します',
    titleEn:
      'Is the Backrooms Movie Scary? A Spoiler-Free Guide to What Kind of Fear It Uses',
    leadJa:
      'どのくらい怖いのか分からない、という人へ。ストーリーに一切触れずに、この映画の怖さがジャンプスケア型ではなく空間型であることと、評価が割れている理由を説明します。',
    leadEn:
      'Not sure how scary it gets? With zero plot spoilers: why this film uses spatial dread rather than jump scares, and why reviews are so split.',
    thumbnailFile: 'Waiting room at Budapest Keleti.jpg',
  },
  {
    slug: 'backrooms-spots-tokyo',
    publishedDate: '2026-09-06',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '映画を観たあとに行きたい、東京の「バックルームズ的」な場所',
    titleEn:
      'Where to Go in Tokyo After Watching the Backrooms Movie',
    leadJa:
      '映画館を出たあと、いつもの帰り道が少し違って見える。その目のまま行ける東京の実在スポットを、地下通路・団地・閉じた駅から選びました。',
    leadEn:
      'If the film changed how your commute looks, here are real Tokyo places with the same air — underground passages, housing estates and closed transit sites.',
    thumbnailFile: '商店街のシャッター (30492827175).jpg',
  },
  {
    slug: 'backrooms-levels-explained',
    publishedDate: '2026-09-06',
    categoryJa: '基礎知識',
    categoryEn: 'Basics',
    titleJa: 'バックルームズの「レベル」とは？レベル0からThe Endまでと、公式設定が存在しない理由',
    titleEn:
      'What Are the Backrooms Levels? From Level 0 to The End — and Why There Is No Official Canon',
    leadJa:
      'レベル0、レベル37、The End。代表的な階層を整理しつつ、なぜwikiごとに設定が食い違うのか、どれが正しいのかという疑問にも答えます。',
    leadEn:
      'Level 0, Level 37, The End. The levels people actually talk about — plus an answer to why no two wikis agree.',
    thumbnailFile: 'HobbyTown USA Oshkosh interior under construction 2002 (The Backrooms).jpg',
  },
  {
    slug: 'poolrooms-explained',
    publishedDate: '2026-09-06',
    categoryJa: '基礎知識',
    categoryEn: 'Basics',
    titleJa: 'プールルーム（Poolrooms）とは？青いタイルの水の空間の正体と、日本で近い場所',
    titleEn:
      'What Are the Poolrooms? Where the Blue-Tiled Water Spaces Came From',
    leadJa:
      '誰もいない室内プール、青いタイル、生ぬるい水。バックルームズより後に生まれたこの空間の成り立ちと、なぜ怖いのに懐かしいのかを解説します。',
    leadEn:
      'An empty indoor pool, blue tile, lukewarm water. Where this imagery actually came from, and why it feels frightening and nostalgic at once.',
    thumbnailFile: 'Swimming Pool Hall 4 Pripyat.jpg',
  },
  {
    slug: 'backrooms-original-photo-location',
    publishedDate: '2026-09-06',
    categoryJa: '事例紹介',
    categoryEn: 'Examples',
    titleJa: 'バックルームズの元ネタ写真はどこで撮られた？2024年に特定された実在の建物',
    titleEn:
      'Where Was the Original Backrooms Photo Taken? The Real Building, Identified in 2024',
    leadJa:
      '5年間わからなかった、あの1枚の撮影場所。2024年に特定された答えは、意外なほど平凡な場所でした。',
    leadEn:
      'For five years nobody knew where that photograph was taken. The answer, pinned down in 2024, turned out to be remarkably ordinary.',
    thumbnailFile: 'HobbyTown USA Oshkosh interior under construction 2002 (The Backrooms).jpg',
  },
  {
    slug: 'backrooms-vs-exit-8',
    publishedDate: '2026-09-06',
    categoryJa: '違いを知る',
    categoryEn: 'Comparisons',
    titleJa: 'バックルームズと『8番出口』は何が違う？似ているようで正反対な2つの無限空間',
    titleEn:
      'Backrooms vs Exit 8: Two Endless Spaces That Work in Opposite Ways',
    leadJa:
      '無人、均質、出口が見えない。よく似た2つですが、恐怖の構造は正反対です。ルールがあるかどうかという決定的な違いを整理しました。',
    leadEn:
      'Empty, uniform, no way out. They look alike, but their fear is built in opposite ways — and it comes down to whether there are rules.',
    thumbnailFile: 'Nokendai Station Platforms.jpg',
  },
  {
    slug: 'who-is-kane-pixels',
    publishedDate: '2026-09-06',
    categoryJa: '歴史・トレンド',
    categoryEn: 'History',
    titleJa: 'Kane Pixels（ケイン・パーソンズ）とは何者か？16歳の投稿から映画監督になるまで',
    titleEn:
      'Who Is Kane Pixels? From a Post at Sixteen to Directing for A24',
    leadJa:
      '掲示板のテキストだったバックルームズを「あの映像」に変えた人物。経歴、代表作、Blender1本で作る手法、生成AIへの発言までまとめました。',
    leadEn:
      'The person who turned message-board text into the footage everyone pictures. His background, key works, Blender-only workflow, and stance on AI.',
    thumbnailFile: 'Static on the playground (48616367).jpg',
  },
  {
    slug: 'what-is-noclip',
    publishedDate: '2026-09-06',
    categoryJa: '基礎知識',
    categoryEn: 'Basics',
    titleJa: 'ノークリップ（noclip）とは？ゲーム用語が「現実の裏側」を意味するようになるまで',
    titleEn:
      'What Does Noclip Mean? How a Game Dev Term Came to Describe the Back of Reality',
    leadJa:
      'もとは壁をすり抜けるためのデバッグ機能でした。用語の由来と、なぜこの一語がネット都市伝説の核心になったのかを解説します。',
    leadEn:
      'It began as a debug feature for walking through walls. Where the term came from, and why one word became the core of an internet legend.',
    thumbnailFile: 'Old TV sets.jpg',
  },
];

// 一覧は新着順(publishedDate の降順)で表示する。Array#sort は安定なので、
// 同じ公開日の記事は ARTICLE_ENTRIES に書いた順のまま並ぶ。
// scripts/generate-articles.js の記事一覧ハブも同じ並び順に揃えてある。
export const ARTICLES: ArticleSummary[] = [...ARTICLE_ENTRIES].sort((a, b) =>
  b.publishedDate.localeCompare(a.publishedDate)
);

// public/articles配下の静的ページ生成(scripts/generate-articles.js)と全く同じ組み立て方に揃えている
export function articleThumbnailUrl(file: string, width = 600): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

// 英語版は別URL（/en/articles/）。アプリの表示言語に合わせて開く
export function articleUrl(slug: string, language: 'ja' | 'en' = 'ja'): string {
  return language === 'en' ? `https://limap.jp/en/articles/${slug}/` : `https://limap.jp/articles/${slug}/`;
}
