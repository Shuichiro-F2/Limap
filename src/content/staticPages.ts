// 「リミナルスペースとは」「使い方」ページの本文データ。
// - サーバー側(api/page.ts, Vercel Serverless Function)と
// - クライアント側(src/screens/AboutScreen.tsx / HelpScreen.tsx)
// の両方から同じ内容を参照するための単一ソース。
// React/React NativeやExpo固有のimportを含まない、プレーンなTSデータのみにしてある
// （api/page.tsはNode環境で実行されるため、RN依存を混ぜると壊れる可能性があるため）。

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StaticPageSection {
  heading: string;
  body: string;
}

export interface StaticPageContent {
  slug: 'about' | 'help' | 'privacy' | 'terms';
  path: string; // サイト内パス（先頭スラッシュなし）
  metaTitle: string; // <title>用（サイト名なし、api/page.ts側でサフィックスを付与）
  metaDescription: string;
  heading: string;
  lead: string;
  sections: StaticPageSection[];
  faq: FaqItem[];
}

export const ABOUT_PAGE: StaticPageContent = {
  slug: 'about',
  path: 'about',
  metaTitle: 'リミナルスペースとは？意味・特徴と日本の実例',
  metaDescription:
    'リミナルスペースとは何か、その意味・特徴・日本各地の実例を解説。廃墟や無人駅、深夜の駐車場など、リミナルスペースをLIMapの地図で記録・共有する方法もご紹介します。',
  heading: 'リミナルスペースとは',
  lead: '「リミナルスペース（liminal space）」とは、日常と非日常のあいだに漂う、奇妙な既視感と静けさをたたえた空間のこと。人の気配がありながら誰もいない、そんな「境界」の空間を指します。',
  sections: [
    {
      heading: 'リミナルスペースの意味',
      body: '「リミナル(liminal)」は、英語で「境界」「過渡的」を意味するラテン語 limen（敷居）に由来する言葉です。リミナルスペースとは、ある状態から別の状態へ移り変わる途中にある空間、たとえば人がいない時間帯のショッピングモールや、営業前の駐車場、終電後の駅のホームなどを指す言葉として、近年インターネットを中心に広まりました。',
    },
    {
      heading: 'リミナルスペースの特徴',
      body: '本来は人で賑わうはずの場所に人の気配がない、時間が止まったような静けさ、蛍光灯の光や壁紙の色合いが醸し出す、どこか懐かしいような、それでいて少し不安になるような感覚。こうした「奇妙な既視感」がリミナルスペース特有の魅力であり、写真や動画のジャンルとしても世界的に人気を集めています。',
    },
    {
      heading: '日本のリミナルスペースの例',
      body: '日本には、廃墟となった施設、深夜に無人となる地方の駅、営業終了後の商店街、人けのない立体駐車場、早朝の高速道路サービスエリアなど、リミナルスペースと呼べる場所が数多く存在します。都市部だけでなく、地方や郊外にも独特の雰囲気を持つ空間が点在しています。',
    },
    {
      heading: 'LIMapでリミナルスペースを記録・共有する',
      body: 'LIMapは、あなたが見つけたリミナルスペースを写真と位置情報とともに地図に記録し、他のユーザーと共有できる地図アプリです。地図の閲覧や投稿の検索はログインなしで自由に行え、気に入った投稿には「いいね」や「行きたい場所」への保存もできます。',
    },
  ],
  faq: [
    {
      question: 'リミナルスペースとはどういう意味ですか？',
      answer:
        '「境界」を意味するラテン語に由来する言葉で、日常と非日常のあいだにあるような、奇妙な既視感を伴う空間を指します。廃墟や無人の施設、営業時間外の商業施設などがその代表例です。',
    },
    {
      question: '日本のリミナルスペースの写真はどこで見られますか？',
      answer:
        'LIMapの地図画面から、ユーザーが投稿した日本各地のリミナルスペースの写真と位置情報を見ることができます。検索タブでキーワードやタグから絞り込むこともできます。',
    },
    {
      question: '自分が見つけたリミナルスペースを投稿できますか？',
      answer: 'はい。LIMapに無料でアカウント登録すると、写真と場所を選んで投稿できます。',
    },
  ],
};

export const HELP_PAGE: StaticPageContent = {
  slug: 'help',
  path: 'help',
  metaTitle: 'LIMapの使い方｜投稿・地図の見方・フォロー機能ガイド',
  metaDescription:
    'LIMapの使い方をご案内します。地図でのリミナルスペースの探し方、写真の投稿方法、いいね・行きたい場所（ブックマーク）、フォロー機能の使い方まで解説します。',
  heading: 'LIMapの使い方',
  lead: 'LIMapは、リミナルスペースを写真と場所で記録・共有する地図アプリです。基本的な使い方をご紹介します。',
  sections: [
    {
      heading: '地図でリミナルスペースを探す',
      body: '地図画面では、これまでに投稿されたリミナルスペースがピンで表示されます。ピンをタップすると詳細を確認でき、検索タブではキーワードやタグで絞り込むこともできます。ログインしなくても、地図の閲覧や投稿の検索は自由に行えます。',
    },
    {
      heading: '投稿する',
      body: '投稿にはアカウント登録（無料）が必要です。投稿ボタンから、写真と場所、簡単な説明文、タグを選んで投稿できます。タイトル欄はなく、説明文の冒頭が自動的に一覧表示用のタイトルとして使われます。',
    },
    {
      heading: 'いいね・行きたい場所（ブックマーク）',
      body: '気になる投稿は、ハートアイコンで「いいね」、しおりアイコンで「行きたい場所」として保存できます。保存した投稿はマイページからいつでも見返せます。',
    },
    {
      heading: 'フォロー機能',
      body: '投稿詳細に表示されるユーザー名をタップするとそのユーザーのプロフィール画面に移動し、フォローできます。フォロー中の数・フォロワー数はマイページで確認できます。',
    },
    {
      heading: '不適切な投稿を見つけたら',
      body: '投稿詳細のメニューから通報できます。内容を確認のうえ対応いたします。',
    },
  ],
  faq: [
    {
      question: 'ログインしないと使えませんか？',
      answer:
        '地図の閲覧や投稿の検索はログインなしでご利用いただけます。投稿・いいね・ブックマーク・フォローにはアカウント登録（無料）が必要です。',
    },
    {
      question: '投稿にタイトルは必要ですか？',
      answer: '不要です。説明文を入力するだけで投稿でき、一覧表示用のタイトルは自動的に生成されます。',
    },
    {
      question: '他のユーザーをフォローするにはどうすればいいですか？',
      answer:
        '投稿詳細画面に表示されているユーザー名（@から始まる表示）をタップするとプロフィール画面に移動し、そこからフォローできます。',
    },
  ],
};

// 下書き段階のプライバシーポリシー／利用規約。文言の最終確認・調整は別途行う前提の暫定版。
export const PRIVACY_PAGE: StaticPageContent = {
  slug: 'privacy',
  path: 'privacy',
  metaTitle: 'プライバシーポリシー',
  metaDescription:
    'LIMap（リマップ）におけるプライバシーポリシーです。取得する情報の種類、利用目的、第三者提供の有無などについて説明しています。',
  heading: 'プライバシーポリシー',
  lead: 'LIMap運営（以下「当運営」といいます）は、本サービス「LIMap（リマップ）」（以下「本サービス」といいます）における利用者の情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。',
  sections: [
    {
      heading: '第1条（基本方針）',
      body: '当運営は、本サービスの提供にあたり取得する利用者の情報の重要性を認識し、関連法令を遵守するとともに、適切な取得・利用・管理に努めます。',
    },
    {
      heading: '第2条（取得する情報）',
      body: '当運営は、本サービスの提供にあたり、以下の情報を取得することがあります。（1）メールアドレス、ユーザー名、パスワード（暗号化した状態で保存します）等のアカウント登録情報。（2）投稿された写真、位置情報（緯度・経度）、説明文、タグ等の投稿コンテンツ。（3）Googleアカウントでログインする場合に、Google社から提供される氏名、メールアドレス、プロフィール画像等の情報。（4）アプリの利用状況、端末情報、IPアドレス等のログ情報。',
    },
    {
      heading: '第3条（利用目的）',
      body: '取得した情報は、以下の目的で利用します。（1）本人確認およびアカウントの管理。（2）投稿・閲覧・いいね・ブックマーク・フォロー等、本サービスの各機能の提供。（3）お問い合わせへの対応。（4）不正利用の防止、利用規約に違反する投稿への対応。（5）本サービスの維持・改善、新機能の検討。',
    },
    {
      heading: '第4条（第三者提供・外部サービスの利用）',
      body: '当運営は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。ただし、本サービスはデータベース・認証基盤としてSupabase、地図表示機能としてMapboxの外部サービスを利用しており、これらのサービス提供者に対しては、機能の提供に必要な範囲で情報が送信・保存されます。また、Googleアカウントでのログインを利用する場合、Google社のプライバシーポリシーも適用されます。',
    },
    {
      heading: '第5条（Cookie等の利用）',
      body: '本サービスのウェブ版では、ログイン状態の維持等、サービス提供に必要な範囲でCookie等の技術を利用することがあります。これらは個人を特定する情報を含みません。',
    },
    {
      heading: '第6条（情報の安全管理）',
      body: '当運営は、取得した情報の漏えい、滅失またはき損の防止その他の安全管理のために、必要かつ適切な措置を講じます。',
    },
    {
      heading: '第7条（開示・訂正・削除等の請求）',
      body: '利用者は、当運営が保有する自己の情報について、開示、訂正、利用停止、削除を請求することができます。ご希望の場合は、アプリ内のお問い合わせ機能よりご連絡ください。内容を確認のうえ、合理的な範囲で対応いたします。',
    },
    {
      heading: '第8条（未成年者の利用について）',
      body: '未成年の方が本サービスを利用する場合は、保護者の同意を得たうえでご利用ください。',
    },
    {
      heading: '第9条（本ポリシーの変更）',
      body: '当運営は、必要に応じて本ポリシーの内容を変更することがあります。変更後の内容は、本サービス上に掲載した時点から効力を生じるものとします。',
    },
    {
      heading: '第10条（お問い合わせ）',
      body: '本ポリシーに関するお問い合わせは、アプリ内のお問い合わせ機能よりご連絡ください。',
    },
  ],
  faq: [],
};

export const TERMS_PAGE: StaticPageContent = {
  slug: 'terms',
  path: 'terms',
  metaTitle: '利用規約',
  metaDescription:
    'LIMap（リマップ）の利用規約です。アカウント登録、禁止事項、投稿コンテンツの取り扱い、免責事項などについて定めています。',
  heading: '利用規約',
  lead: 'この利用規約（以下「本規約」といいます）は、LIMap運営（以下「当運営」といいます）が提供する「LIMap（リマップ）」（以下「本サービス」といいます）の利用条件を定めるものです。利用者の皆様（以下「利用者」といいます）には、本規約に同意のうえ本サービスをご利用いただきます。',
  sections: [
    {
      heading: '第1条（適用）',
      body: '本規約は、利用者と当運営との間の本サービスの利用に関わる一切の関係に適用されるものとします。',
    },
    {
      heading: '第2条（アカウント登録）',
      body: '本サービスの一部の機能（投稿、いいね、ブックマーク、フォロー等）の利用には、アカウント登録が必要です。利用者は、真実かつ正確な情報を登録するものとし、登録情報に変更があった場合は速やかに更新するものとします。',
    },
    {
      heading: '第3条（禁止事項）',
      body: '利用者は、本サービスの利用にあたり、以下の行為をしてはならないものとします。（1）法令または公序良俗に違反する行為。（2）他の利用者、施設の所有者・管理者その他の第三者の権利（著作権、肖像権、プライバシー等）を侵害する行為。（3）不正アクセスその他本サービスの運営を妨害する行為。（4）私有地や立入禁止区域への不法な侵入その他の違法行為を助長・推奨する内容の投稿。（5）自己または第三者になりすます行為、虚偽の情報を登録する行為。（6）スパム行為、営利目的の宣伝・勧誘行為（当運営が認めたものを除く）。（7）その他、当運営が不適切と判断する行為。',
    },
    {
      heading: '第4条（投稿コンテンツの取り扱い）',
      body: '利用者が本サービスに投稿した写真・文章等のコンテンツの著作権は、投稿した利用者に帰属します。ただし、利用者は当運営に対し、本サービスの提供・改善・宣伝に必要な範囲で、当該コンテンツを利用（複製、表示、配信、加工等を含みます）する権利を無償で許諾するものとします。',
    },
    {
      heading: '第5条（コンテンツの削除・利用停止）',
      body: '当運営は、投稿されたコンテンツが本規約に違反すると判断した場合、事前の通知なくコンテンツの削除、利用者のアカウントの利用停止その他必要な措置を講じることができるものとします。',
    },
    {
      heading: '第6条（免責事項）',
      body: '当運営は、本サービスに投稿された情報（位置情報、写真、説明文等）の正確性、安全性、最新性についていかなる保証も行いません。投稿された場所への訪問は利用者自身の判断と責任において行うものとし、私有地への立ち入りや現地での事故・トラブル等について、当運営は一切の責任を負いません。また、当運営は、本サービスの利用により生じた損害について、当運営の故意または重過失による場合を除き、責任を負わないものとします。',
    },
    {
      heading: '第7条（サービス内容の変更・中断・終了）',
      body: '当運営は、利用者への事前の通知なく、本サービスの内容を変更し、または本サービスの提供を中断・終了することができるものとします。これにより利用者に生じた損害について、当運営は責任を負わないものとします。',
    },
    {
      heading: '第8条（利用規約の変更）',
      body: '当運営は、必要と判断した場合には、利用者に通知することなく本規約を変更することができるものとします。変更後の本規約は、本サービス上に掲載した時点から効力を生じるものとします。',
    },
    {
      heading: '第9条（準拠法・裁判管轄）',
      body: '本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当運営の所在地を管轄する裁判所を専属的合意管轄とします。',
    },
  ],
  faq: [],
};

export const STATIC_PAGES: Record<'about' | 'help' | 'privacy' | 'terms', StaticPageContent> = {
  about: ABOUT_PAGE,
  help: HELP_PAGE,
  privacy: PRIVACY_PAGE,
  terms: TERMS_PAGE,
};

// ---- 英語版（アプリの表示言語が英語のときに使う） ----
// サーバー側(api/page.ts)が返す初期HTMLは日本語版のまま。
// プライバシーポリシー・利用規約は日本語版を正とし、英語版は参考訳として冒頭でその旨を明記する。
// 日本語版の内容を変えたときは、英語版も合わせて更新すること。

const TRANSLATION_NOTE =
  'This English version is a translation provided for reference. The Japanese version is the official version, and it prevails in the event of any discrepancy.';

export const ABOUT_PAGE_EN: StaticPageContent = {
  slug: 'about',
  path: 'about',
  metaTitle: 'What Is a Liminal Space? Meaning, Characteristics and Examples in Japan',
  metaDescription:
    'Learn what liminal spaces are, what makes them distinctive, and real examples across Japan, plus how to record and share abandoned buildings, empty stations and late-night parking lots on the LIMap map.',
  heading: 'What is a Liminal Space?',
  lead: 'A "liminal space" is a place that drifts between the everyday and the extraordinary, filled with an uncanny sense of déjà vu and stillness. It describes a "threshold" space that feels as though people should be there, yet no one is.',
  sections: [
    {
      heading: 'What "Liminal Space" Means',
      body: 'The word "liminal" means "on a boundary" or "transitional," and comes from the Latin limen, meaning "threshold." A liminal space is a place caught partway between one state and another, such as a shopping mall at an hour when no one is there, a parking lot before opening time, or a station platform after the last train. The term has spread widely in recent years, mainly on the internet.',
    },
    {
      heading: 'What Makes a Liminal Space',
      body: 'A place that should be bustling but shows no sign of people, a stillness as if time has stopped, and the glow of fluorescent lights or the color of the wallpaper that feels somehow nostalgic and yet slightly unsettling. This "uncanny déjà vu" is the unique appeal of liminal spaces, and they have become a popular genre of photos and videos around the world.',
    },
    {
      heading: 'Examples of Liminal Spaces in Japan',
      body: 'Japan has many places that could be called liminal spaces: abandoned facilities, rural stations that empty out late at night, shopping streets after closing, deserted multi-story parking garages, and expressway service areas in the early morning. Spaces with a distinctive atmosphere are found not only in cities but also in the countryside and the suburbs.',
    },
    {
      heading: 'Record and Share Liminal Spaces with LIMap',
      body: 'LIMap is a map app where you can record the liminal spaces you find on a map, with photos and locations, and share them with other users. You can browse the map and search posts freely without logging in, and you can "like" the posts you enjoy or save them to your list of places you want to visit.',
    },
  ],
  faq: [
    {
      question: 'What does "liminal space" mean?',
      answer:
        'The term comes from a Latin word meaning "threshold," and refers to a space with an uncanny sense of déjà vu, as if it sits between the everyday and the extraordinary. Typical examples include abandoned buildings, empty facilities, and commercial spaces outside business hours.',
    },
    {
      question: 'Where can I see photos of liminal spaces in Japan?',
      answer:
        "On LIMap's map screen, you can see photos and locations of liminal spaces across Japan posted by users. You can also narrow them down by keyword or tag in the Search tab.",
    },
    {
      question: 'Can I post liminal spaces I have found?',
      answer: 'Yes. Create a free LIMap account, and you can post by choosing a photo and a location.',
    },
  ],
};

export const HELP_PAGE_EN: StaticPageContent = {
  slug: 'help',
  path: 'help',
  metaTitle: 'How to Use LIMap: Posting, Browsing the Map and Following',
  metaDescription:
    'A guide to using LIMap: how to find liminal spaces on the map, how to post photos, how to use likes and your list of places to visit (bookmarks), and how to follow other users.',
  heading: 'How to Use LIMap',
  lead: 'LIMap is a map app for recording and sharing liminal spaces with photos and locations. Here is an introduction to the basics.',
  sections: [
    {
      heading: 'Find Liminal Spaces on the Map',
      body: 'The map screen shows liminal spaces posted so far as pins. Tap a pin to see its details. In the Search tab you can also narrow down posts by keyword or tag. You can browse the map and search posts freely without logging in.',
    },
    {
      heading: 'Posting',
      body: 'Posting requires a free account. From the post button, choose a photo, a location, a short description and tags, then post. There is no separate title field; the beginning of the description is automatically used as the title shown in lists.',
    },
    {
      heading: 'Likes and Places to Visit (Bookmarks)',
      body: 'Tap the heart icon to "like" a post, or the bookmark icon to save it as a place you want to visit. You can look back at saved posts anytime from My Page.',
    },
    {
      heading: 'Following',
      body: "Tap the username shown on a post's detail screen to open that user's profile, where you can follow them. You can check how many people you follow and how many followers you have on My Page.",
    },
    {
      heading: 'If You Find an Inappropriate Post',
      body: "You can report it from the menu on the post's detail screen. We will review the content and take appropriate action.",
    },
  ],
  faq: [
    {
      question: 'Do I need to log in to use LIMap?',
      answer:
        'You can browse the map and search posts without logging in. Posting, liking, bookmarking and following require a free account.',
    },
    {
      question: 'Do posts need a title?',
      answer: 'No. You can post by entering just a description, and a title for lists is generated automatically.',
    },
    {
      question: 'How do I follow other users?',
      answer:
        "Tap the username (shown starting with @) on a post's detail screen to open their profile, and follow them from there.",
    },
  ],
};

export const PRIVACY_PAGE_EN: StaticPageContent = {
  slug: 'privacy',
  path: 'privacy',
  metaTitle: 'Privacy Policy',
  metaDescription:
    'The privacy policy of LIMap, describing the types of information we collect, the purposes for which we use it, and whether it is provided to third parties.',
  heading: 'Privacy Policy',
  lead: `The LIMap operator (the "Operator") sets out this privacy policy (the "Policy") regarding the handling of user information in the service "LIMap" (the "Service"). ${TRANSLATION_NOTE}`,
  sections: [
    {
      heading: 'Article 1 (Basic Policy)',
      body: 'The Operator recognizes the importance of the user information it collects in providing the Service, complies with applicable laws and regulations, and strives to collect, use and manage such information appropriately.',
    },
    {
      heading: 'Article 2 (Information We Collect)',
      body: 'In providing the Service, the Operator may collect the following information: (1) account registration information such as your email address, username and password (stored in encrypted form); (2) posted content such as photos, location information (latitude and longitude), descriptions and tags; (3) when you log in with a Google account, information provided by Google, such as your name, email address and profile picture; and (4) log information such as how you use the app, device information and IP address.',
    },
    {
      heading: 'Article 3 (Purposes of Use)',
      body: 'We use the information we collect for the following purposes: (1) identity verification and account management; (2) providing the features of the Service, such as posting, browsing, likes, bookmarks and following; (3) responding to inquiries; (4) preventing misuse and dealing with posts that violate the Terms of Service; and (5) maintaining and improving the Service and considering new features.',
    },
    {
      heading: 'Article 4 (Provision to Third Parties and Use of External Services)',
      body: 'Except as required by law, the Operator will not provide personal information to third parties without your consent. However, the Service uses the external services Supabase (for its database and authentication) and Mapbox (for map display), and information is sent to and stored by these service providers to the extent necessary to provide those features. In addition, if you log in with a Google account, Google\'s privacy policy also applies.',
    },
    {
      heading: 'Article 5 (Use of Cookies and Similar Technologies)',
      body: 'The web version of the Service may use cookies and similar technologies to the extent necessary to provide the Service, such as keeping you logged in. These do not contain information that identifies individuals.',
    },
    {
      heading: 'Article 6 (Security of Information)',
      body: 'The Operator takes necessary and appropriate measures to prevent the leakage, loss or damage of the information it collects and otherwise to manage it securely.',
    },
    {
      heading: 'Article 7 (Requests for Disclosure, Correction, Deletion, etc.)',
      body: 'You may request disclosure, correction, suspension of use or deletion of your information held by the Operator. To make a request, please contact us through the contact feature in the app. We will review your request and respond to the extent reasonable.',
    },
    {
      heading: 'Article 8 (Use by Minors)',
      body: 'If you are a minor, please obtain the consent of a parent or guardian before using the Service.',
    },
    {
      heading: 'Article 9 (Changes to This Policy)',
      body: 'The Operator may change the contents of this Policy as necessary. The revised Policy takes effect when it is posted on the Service.',
    },
    {
      heading: 'Article 10 (Contact)',
      body: 'For inquiries regarding this Policy, please contact us through the contact feature in the app.',
    },
  ],
  faq: [],
};

export const TERMS_PAGE_EN: StaticPageContent = {
  slug: 'terms',
  path: 'terms',
  metaTitle: 'Terms of Service',
  metaDescription:
    'The Terms of Service of LIMap, covering account registration, prohibited conduct, the handling of posted content, disclaimers and more.',
  heading: 'Terms of Service',
  lead: `These Terms of Service (the "Terms") set out the conditions for using "LIMap" (the "Service") provided by the LIMap operator (the "Operator"). All users of the Service ("Users") are asked to agree to these Terms before using the Service. ${TRANSLATION_NOTE}`,
  sections: [
    {
      heading: 'Article 1 (Application)',
      body: 'These Terms apply to all relationships between Users and the Operator relating to the use of the Service.',
    },
    {
      heading: 'Article 2 (Account Registration)',
      body: 'Some features of the Service (such as posting, likes, bookmarks and following) require account registration. Users shall register true and accurate information and shall promptly update it if it changes.',
    },
    {
      heading: 'Article 3 (Prohibited Conduct)',
      body: 'When using the Service, Users shall not: (1) act in violation of laws, regulations or public order and morals; (2) infringe the rights (including copyright, portrait rights and privacy) of other Users, owners or managers of facilities, or any other third party; (3) gain unauthorized access to or otherwise interfere with the operation of the Service; (4) post content that encourages or promotes illegal entry onto private property or restricted areas, or any other illegal act; (5) impersonate themselves or any third party, or register false information; (6) engage in spam, or in advertising or solicitation for commercial purposes (except where approved by the Operator); or (7) engage in any other conduct that the Operator deems inappropriate.',
    },
    {
      heading: 'Article 4 (Handling of Posted Content)',
      body: 'Copyright in photos, text and other content that Users post to the Service belongs to the User who posted it. However, Users grant the Operator, free of charge, the right to use such content (including reproducing, displaying, distributing and editing it) to the extent necessary to provide, improve and promote the Service.',
    },
    {
      heading: 'Article 5 (Removal of Content and Suspension of Use)',
      body: 'If the Operator determines that posted content violates these Terms, it may, without prior notice, remove the content, suspend the User\'s account, or take any other necessary measures.',
    },
    {
      heading: 'Article 6 (Disclaimer)',
      body: 'The Operator makes no guarantee as to the accuracy, safety or timeliness of information posted to the Service (including locations, photos and descriptions). Visiting posted places is at each User\'s own discretion and responsibility, and the Operator bears no responsibility whatsoever for entry onto private property or for any accidents or trouble at a location. In addition, the Operator shall not be liable for any damage arising from use of the Service, except in cases of intentional misconduct or gross negligence by the Operator.',
    },
    {
      heading: 'Article 7 (Changes, Interruption and Termination of the Service)',
      body: 'The Operator may change the contents of the Service, or interrupt or terminate the Service, without prior notice to Users. The Operator shall not be liable for any damage to Users arising from this.',
    },
    {
      heading: 'Article 8 (Changes to These Terms)',
      body: 'The Operator may change these Terms without notice to Users when it deems necessary. The revised Terms take effect when they are posted on the Service.',
    },
    {
      heading: 'Article 9 (Governing Law and Jurisdiction)',
      body: 'These Terms shall be governed by and construed in accordance with the laws of Japan. Any dispute relating to the Service shall be subject to the exclusive jurisdiction of the court having jurisdiction over the location of the Operator.',
    },
  ],
  faq: [],
};

export const STATIC_PAGES_EN: Record<'about' | 'help' | 'privacy' | 'terms', StaticPageContent> = {
  about: ABOUT_PAGE_EN,
  help: HELP_PAGE_EN,
  privacy: PRIVACY_PAGE_EN,
  terms: TERMS_PAGE_EN,
};

// 表示言語に応じたページ内容を返す（i18n.tsx は React に依存するため、言語はリテラル型で受ける）
export function getStaticPage(slug: StaticPageContent['slug'], language: 'ja' | 'en'): StaticPageContent {
  return language === 'en' ? STATIC_PAGES_EN[slug] : STATIC_PAGES[slug];
}
