// 日本のリミナルスペース一覧（api/japan.ts）で使う都道府県の定義。
// タグ名は「都・府・県」を付けない形（例: 北海道、東京、兵庫）で、公式スポットの都道府県タグと一致させている
// （supabase/migrations/0021_official_spot_tags_and_dedup.sql）。並びは JIS の都道府県コード順。

export const JAPAN_REGIONS: { region: string; prefectures: string[] }[] = [
  { region: '北海道・東北', prefectures: ['北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島'] },
  { region: '関東', prefectures: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'] },
  { region: '中部', prefectures: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知'] },
  { region: '近畿', prefectures: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'] },
  { region: '中国・四国', prefectures: ['鳥取', '島根', '岡山', '広島', '山口', '徳島', '香川', '愛媛', '高知'] },
  { region: '九州・沖縄', prefectures: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'] },
];

export const JAPAN_PREFECTURES: string[] = JAPAN_REGIONS.flatMap((r) => r.prefectures);

// 表示用の正式名（見出しで使う）
export function prefectureFullName(name: string): string {
  if (name === '北海道') return name;
  if (name === '東京') return '東京都';
  if (name === '京都' || name === '大阪') return `${name}府`;
  return `${name}県`;
}
