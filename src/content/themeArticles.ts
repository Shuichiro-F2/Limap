// タグ別ページ（api/tag.ts）から、そのテーマを詳しく紹介した記事（content/articles.json）へつなぐための対応表。
// 都道府県のタグは地方の記事（src/content/japan.ts の REGIONAL_ARTICLES）が受け持つので、ここには入れない。
// 記事を足したら、関係するタグにも足す（slug の存在は scripts/check-articles.js で確認）。

import { COUNTRY_TAGS } from './spotSeo';

export const THEME_ARTICLES: { slug: string; label: string; tags: string[] }[] = [
  { slug: 'abandoned-hotel-liminal-spaces', label: '廃ホテルのリミナルスペース', tags: ['廃ホテル', 'ホテル', '温泉', '廃墟'] },
  { slug: 'abandoned-school-liminal-spaces', label: '廃校のリミナルスペース', tags: ['廃校', '炭鉱', '廃墟'] },
  { slug: 'station-liminal-spaces', label: '駅のリミナルスペース', tags: ['駅', '無人駅', '秘境駅', '地下鉄駅'] },
  { slug: 'underground-mall-liminal-spaces', label: '地下街・地下通路のリミナルスペース', tags: ['地下', '地下街', '地下通路', '商業施設'] },
  { slug: 'submerged-liminal-spaces', label: '水に沈んだ場所のリミナルスペース', tags: ['水没'] },
  { slug: 'observation-deck-liminal-spaces', label: '展望室のリミナルスペース', tags: ['公共施設', '高層ビル街'] },
  { slug: 'amusement-park-liminal-spaces', label: '遊園地のリミナルスペース', tags: ['廃遊園地', '屋上遊園地', 'レジャー施設'] },
  { slug: 'poolrooms-explained', label: 'プールルームズとは', tags: ['プールコア', 'レジャー施設'] },
  { slug: 'haikyo-photo-spots-japan', label: '廃墟の撮影スポットを地図で探す', tags: ['廃墟', '廃工場', '産業遺産'] },
  { slug: 'liminal-spots-world', label: '世界のリミナルスペース15選', tags: ['海外', 'ゴーストタウン', '空港', '計画都市', ...COUNTRY_TAGS] },
  { slug: 'what-is-liminal-space', label: 'リミナルスペースとは', tags: ['リミナルスペース'] },
];

export function themeArticlesFor(tagName: string): { slug: string; label: string }[] {
  return THEME_ARTICLES.filter((a) => a.tags.includes(tagName));
}
