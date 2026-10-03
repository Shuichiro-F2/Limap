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
    titleJa: 'バックルームは実在する？元ネタ写真の撮影場所と、日本で「黄色い部屋」に近い場所',
    titleEn: 'Are the Backrooms Real? Where the Original Photo Was Taken, and Places in Japan That Feel the Same',
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
    titleJa: 'プールルーム（プールルームズ）とは？青いタイルの水の空間の正体と、日本で近い場所',
    titleEn:
      'What Are the Poolrooms? Where the Blue-Tiled Water Spaces Came From, and Where to Feel Them in Japan',
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
    titleJa: 'ノークリップ（noclip）とは？意味と語源、ゲーム用語が「現実の裏側」を指すようになるまで',
    titleEn:
      'Noclip Meaning: What Noclip Is, and How a Game Term Came to Describe the Back of Reality',
    leadJa:
      'もとは壁をすり抜けるためのデバッグ機能でした。用語の由来と、なぜこの一語がネット都市伝説の核心になったのかを解説します。',
    leadEn:
      'It began as a debug feature for walking through walls. Where the term came from, and why one word became the core of an internet legend.',
    thumbnailFile: 'Old TV sets.jpg',
  },
  {
    slug: 'liminal-space-games',
    publishedDate: '2026-09-28',
    categoryJa: 'ゲーム',
    categoryEn: 'Games',
    titleJa:
      'リミナルスペースを歩けるゲーム7選｜『8番出口』『Pools』『Escape the Backrooms』ほか、怖さと日本語対応まで',
    titleEn:
      '7 Games Where You Can Walk Through Liminal Spaces: The Exit 8, Pools, Escape the Backrooms and More',
    leadJa:
      '『8番出口』『Pools』『Escape the Backrooms』など、リミナルスペースやバックルームズを歩ける7本を、怖さや日本語対応とあわせて紹介。現実に行ける近い場所も。',
    leadEn:
      'Seven games that let you walk through liminal spaces and the Backrooms, from The Exit 8 to Pools and Escape the Backrooms, with how scary they are and real places that feel like them.',
    thumbnailFile: 'Tokyo-STA Keiyo-underground-passage.jpg',
  },
  {
    slug: 'pools-game',
    publishedDate: '2026-09-28',
    categoryJa: 'ゲーム',
    categoryEn: 'Games',
    titleJa:
      'ゲーム『Pools』とは？怖い？日本語は？どこで遊べる？プールルームを歩く作品と、現実の「Poolsっぽい」場所',
    titleEn:
      'What Is the Game Pools? Is It Scary? Where Can You Play It? The Poolrooms Game, and Real Places That Feel Like Pools',
    leadJa:
      '敵も台詞も音楽もない、タイルのプールを歩くゲーム『Pools』。元になった「プールルーム」、遊べる機種と日本語、怖さの種類、現実の近い場所まで解説します。',
    leadEn:
      'Pools, the game of wandering tiled pools with no enemies, dialogue or music: the Poolrooms behind it, platforms and language, what kind of fear it offers, and real places like it.',
    thumbnailFile: 'Vancouver - Robert Lee YMCA pool 01.jpg',
  },
  {
    slug: 'liminal-spots-tokai',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '静岡・東海のリミナルスペース｜光のエスカレーターから昭和の駅舎まで、実在する8か所',
    titleEn:
      'Liminal Spaces in Shizuoka and Tokai: 8 Real Places, From Escalators of Light to a Showa-Era Station',
    leadJa:
      '山の中を上る光のエスカレーター、平衡感覚がずれる作品、工場の光を見下ろす展望室、昭和の駅舎。静岡・岐阜・三重で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'Escalators of light climbing into a mountain, an artwork that throws off your balance, an observation room over factory lights and a Showa-era station: real liminal spaces you can visit in Shizuoka, Gifu and Mie.',
    thumbnailFile: '養老天命反転地01.jpg',
  },
  {
    slug: 'liminal-spots-kitakanto',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '北関東のリミナルスペース｜地下の採掘場跡から県庁の最上階まで、実在する9か所',
    titleEn:
      'Liminal Spaces in North Kanto: 9 Real Places, From an Underground Quarry to the Top Floors of Prefectural Offices',
    leadJa:
      '計画都市の沈んだ広場、石を掘り出した地下空間、夜まで無料の県庁の最上階、廃線跡のめがね橋。茨城・栃木・群馬で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      "A sunken plaza in a planned city, an underground quarry, prefectural office top floors open late for free and a disused railway's arch bridge: real liminal spaces you can visit in Ibaraki, Tochigi and Gunma.",
    thumbnailFile: 'Inside of the Oya History Museum 20251012c.jpg',
  },
  {
    slug: 'liminal-spots-okinawa',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '沖縄のリミナルスペース｜高架の下のビーチから最南端のアーケードまで、実在する7か所',
    titleEn:
      "Liminal Spaces in Okinawa: 7 Real Places, From a Beach Under an Elevated Road to Japan's Southernmost Arcade",
    leadJa:
      '観光地の裏側のアーケード、高架の道路が横切るビーチ、海の上の一本道、海洋博の展示館。沖縄で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'Arcades behind the tourist streets, a beach under an elevated road, a causeway across the sea and an expo-era exhibition hall: real liminal spaces you can visit in Okinawa.',
    thumbnailFile: 'Naminoue Beach and Naminouebashi Bridge 20150317-1.JPG',
  },
  {
    slug: 'liminal-spots-hokuriku-koshinetsu',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '北陸・甲信越のリミナルスペース｜明治の鉄道トンネルから丸窓の図書館まで、実在する8か所',
    titleEn:
      'Liminal Spaces in Hokuriku and Koshinetsu: 8 Real Places, From a Meiji-Era Railway Tunnel to a Library of Round Windows',
    leadJa:
      '遊歩道になった明治の鉄道トンネル、光の通路、丸窓の白い図書館、駅とつながる文化施設。北陸・甲信越で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'A Meiji-era railway tunnel turned walking path, a passage of light, a white library of round windows and a cultural center joined to a station: real liminal spaces you can visit in Hokuriku and Koshinetsu.',
    thumbnailFile: 'Find47 Niigata-Kiyotsu Gorge Tunnel-m.jpg',
  },
  {
    slug: 'liminal-spots-chugoku-shikoku',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '中国・四国のリミナルスペース｜丹下健三の県庁舎から廃線跡まで、実在する9か所',
    titleEn:
      "Liminal Spaces in Chugoku and Shikoku: 9 Real Places, From Kenzo Tange's Prefectural Office to Abandoned Railway Lines",
    leadJa:
      '丹下健三の県庁舎、ごみ処理工場を突き抜ける通路、列車の来ない終着駅、竹林の廃線跡。中国・四国で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      "Kenzo Tange's prefectural office, a walkway through a waste plant, termini no train will reach and a disused line under bamboo: real liminal spaces you can visit in Chugoku and Shikoku.",
    thumbnailFile: 'Kagawa Prefecture Office East Interior.JPG',
  },
  {
    slug: 'liminal-spots-tohoku',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '東北のリミナルスペース｜もう出航しない連絡船から白い美術館まで、実在する8か所',
    titleEn:
      'Liminal Spaces in Tohoku: 8 Real Places, From a Ferry That Will Never Sail to a White Art Museum',
    leadJa:
      'もう出航しない連絡船、白い迷路の美術館、客のいない銀行、すれ違わないらせんのお堂。東北で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'A ferry that will never sail, a white maze of a museum, a bank with no customers and a spiral hall where no one passes: real liminal spaces you can visit in Tohoku.',
    thumbnailFile: '140913 Aomori Museum of Art Japan02bs3.jpg',
  },
  {
    slug: 'liminal-spots-kyushu',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '九州のリミナルスペース｜海底の歩行者トンネルから昭和の鉄塔まで、実在する9か所',
    titleEn:
      'Liminal Spaces in Kyushu: 9 Real Places, From an Undersea Pedestrian Tunnel to a Showa-Era Steel Tower',
    leadJa:
      '海の下を歩いて渡るトンネル、照明を抑えた地下街、昭和の港の鉄塔、斜めに上るエレベーター。九州で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'A tunnel you walk under the sea, a dimly lit underground mall, a Showa-era port tower and an inclined elevator: real liminal spaces you can visit in Kyushu.',
    thumbnailFile: 'Kanmon Tunnel pedestrian path (40116027523).jpg',
  },
  {
    slug: 'liminal-spots-hokkaido',
    publishedDate: '2026-09-28',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '北海道のリミナルスペース｜札幌の地下通路から湖に沈む橋まで、実在する9か所',
    titleEn:
      "Liminal Spaces in Hokkaido: 9 Real Places, From Sapporo's Underground Walkways to a Bridge That Sinks Into a Lake",
    leadJa:
      '札幌の地下歩行空間、小樽の廃線跡、もう出航しない連絡船、湖に沈む橋。北海道で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      "Sapporo's underground walkway, a disused railway in Otaru, a ferry that will never sail and a bridge that sinks into a lake: real liminal spaces you can visit in Hokkaido.",
    thumbnailFile: 'Taushubetsu-Bridge.jpg',
  },
  {
    slug: 'liminal-spots-nagoya',
    publishedDate: '2026-09-27',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '名古屋のリミナルスペース｜地下街・昭和の庁舎など、実在する8か所',
    titleEn:
      'Liminal Spaces in Nagoya: 8 Real Places, From Underground Malls to Showa-Era Public Buildings',
    leadJa:
      '1957年開業の地下街、100mの廊下が続く市役所、赤レンガの旧裁判所。名古屋で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      'Underground malls from 1957, a city hall with a 100-meter corridor, a red-brick former courthouse: real liminal spaces you can visit in Nagoya.',
    thumbnailFile: 'Fushimi Underground Shopping Street Passageway.jpg',
  },
  {
    slug: 'liminal-spots-kansai',
    publishedDate: '2026-09-27',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '関西のリミナルスペース撮影スポット｜大阪・神戸・奈良・滋賀の実在する場所',
    titleEn: 'Liminal Space Photo Spots in Kansai: Real Places in Osaka, Kobe, Nara and Shiga',
    leadJa:
      '神戸の人工島、世界初のカプセルホテル、鉄橋や選鉱場の跡。関西で実際に行けるリミナルスペースを、LIMapの登録スポットから選びました。',
    leadEn:
      "Kobe's artificial island, the world's first capsule hotel, the remains of a viaduct and an ore plant: real liminal spaces you can visit in Kansai.",
    thumbnailFile: 'River mall01s3200.jpg',
  },
  {
    slug: 'liminal-spots-tokyo',
    publishedDate: '2026-10-03',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '東京のリミナルスペース｜駅の地下通路から屋上の観覧車まで、実在する8か所',
    titleEn: 'Liminal Spaces in Tokyo: 8 Real Places, From Deep Station Passages to a Rooftop Ferris Wheel',
    leadJa:
      '成田新幹線の予定地を使った東京駅の京葉線通路、駐車場だった丸の内の地下通路、1955年開業の浅草地下街。東京で実際に行けるリミナルスペースを選びました。',
    leadEn:
      'A Tokyo Station passage built in space meant for the Narita Shinkansen, a Marunouchi walkway that was once a car park, an underground street from 1955: real liminal spaces you can visit in Tokyo.',
    thumbnailFile: 'JR Tokyo Station Keiyo Underground Passage.JPG',
  },
  {
    slug: 'liminal-spots-minami-kanto',
    publishedDate: '2026-10-03',
    categoryJa: '実在スポット',
    categoryEn: 'Real Spots',
    titleJa: '神奈川・千葉・埼玉のリミナルスペース｜地下神殿から昭和の無人駅まで、実在する8か所',
    titleEn:
      'Liminal Spaces in Kanagawa, Chiba and Saitama: 8 Real Places, From an Underground Temple to Showa-Era Stations',
    leadJa:
      '1930年開業の国道駅、海を見下ろす根府川駅、旧成田空港駅、地下神殿。神奈川・千葉・埼玉で実際に行けるリミナルスペースを選びました。',
    leadEn:
      'Kokudo Station from 1930, Nebukawa Station above the sea, the former Narita Airport Station and an underground temple: real liminal spaces in Kanagawa, Chiba and Saitama.',
    thumbnailFile: 'Metropolitan Area Outer Underground Discharge Channel (10885985325).jpg',
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
