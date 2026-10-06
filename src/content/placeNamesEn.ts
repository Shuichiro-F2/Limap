// 英語のスポットのページ（api/spot-en.ts）で使う、都道府県タグ・国名タグの英語表記。
// タグの名前（日本語）をキーにする。都道府県は src/content/japan.ts、国は src/content/spotSeo.ts の COUNTRY_TAGS と合わせる。

export const PREFECTURE_EN: Record<string, string> = {
  北海道: 'Hokkaido', 青森: 'Aomori', 岩手: 'Iwate', 宮城: 'Miyagi', 秋田: 'Akita', 山形: 'Yamagata', 福島: 'Fukushima',
  茨城: 'Ibaraki', 栃木: 'Tochigi', 群馬: 'Gunma', 埼玉: 'Saitama', 千葉: 'Chiba', 東京: 'Tokyo', 神奈川: 'Kanagawa',
  新潟: 'Niigata', 富山: 'Toyama', 石川: 'Ishikawa', 福井: 'Fukui', 山梨: 'Yamanashi', 長野: 'Nagano', 岐阜: 'Gifu',
  静岡: 'Shizuoka', 愛知: 'Aichi', 三重: 'Mie', 滋賀: 'Shiga', 京都: 'Kyoto', 大阪: 'Osaka', 兵庫: 'Hyogo', 奈良: 'Nara',
  和歌山: 'Wakayama', 鳥取: 'Tottori', 島根: 'Shimane', 岡山: 'Okayama', 広島: 'Hiroshima', 山口: 'Yamaguchi',
  徳島: 'Tokushima', 香川: 'Kagawa', 愛媛: 'Ehime', 高知: 'Kochi', 福岡: 'Fukuoka', 佐賀: 'Saga', 長崎: 'Nagasaki',
  熊本: 'Kumamoto', 大分: 'Oita', 宮崎: 'Miyazaki', 鹿児島: 'Kagoshima', 沖縄: 'Okinawa',
};

export const COUNTRY_EN: Record<string, string> = {
  アメリカ: 'United States', イギリス: 'United Kingdom', イタリア: 'Italy', ドイツ: 'Germany', フランス: 'France',
  スペイン: 'Spain', スウェーデン: 'Sweden', 香港: 'Hong Kong', 中国: 'China', ブラジル: 'Brazil', ベルギー: 'Belgium',
  セルビア: 'Serbia', ポルトガル: 'Portugal', ロシア: 'Russia', トルコ: 'Turkey', カナダ: 'Canada', ノルウェー: 'Norway',
  韓国: 'South Korea', 北朝鮮: 'North Korea', 台湾: 'Taiwan', 南アフリカ: 'South Africa', ウクライナ: 'Ukraine',
  ルーマニア: 'Romania', メキシコ: 'Mexico', ウズベキスタン: 'Uzbekistan', カザフスタン: 'Kazakhstan', オーストリア: 'Austria',
  チェコ: 'Czech Republic', スリランカ: 'Sri Lanka', アラブ首長国連邦: 'United Arab Emirates', タイ: 'Thailand',
  ブルガリア: 'Bulgaria', マレーシア: 'Malaysia', インド: 'India', アンゴラ: 'Angola', ナミビア: 'Namibia',
  'ボスニア・ヘルツェゴビナ': 'Bosnia and Herzegovina', オーストラリア: 'Australia', アルゼンチン: 'Argentina', チリ: 'Chile',
  トルクメニスタン: 'Turkmenistan', アゼルバイジャン: 'Azerbaijan', エジプト: 'Egypt', 北マケドニア: 'North Macedonia',
  ベトナム: 'Vietnam', コートジボワール: "Côte d'Ivoire", スイス: 'Switzerland', オランダ: 'Netherlands',
};

// タグの名前から英語の地名を作る（例: ['東京'] → 'Tokyo, Japan'、['イタリア'] → 'Italy'）
export function placeLabelEn(tagNames: string[]): string {
  const prefs = tagNames.filter((n) => PREFECTURE_EN[n]).map((n) => PREFECTURE_EN[n]);
  if (prefs.length) return `${prefs.join(' / ')}, Japan`;
  const country = tagNames.find((n) => COUNTRY_EN[n]);
  return country ? COUNTRY_EN[country] : '';
}
