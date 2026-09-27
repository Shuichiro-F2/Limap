-- 北陸・甲信越の公式スポット7件と沖縄の公式スポット7件を追加し、仙台の個人の住宅跡1件を非公開にする
-- （記事「北陸・甲信越のリミナルスペース」「沖縄のリミナルスペース」用。2026-09-28）
--
-- 追加する14件は、どれも今も誰でも行ける場所（遊歩道になった旧鉄道トンネル・観光トンネル・公園・図書館・美術館・
-- 公共施設・展望室・アーケード商店街・市庁舎・ビーチ・道路・展示館）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
-- 富山・石川・沖縄の都道府県タグはまだ無かったので、ここで作る（既にあるタグは何もしない）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 使うタグ（まだ無いものだけ作られる）
insert into public.tags (name) values ('リミナルスペース'), ('山梨'), ('トンネル'), ('廃線跡'), ('新潟'), ('富山'), ('広場'), ('公共施設'), ('石川'), ('長野'), ('平成レトロ'), ('沖縄'), ('商店街'), ('昭和レトロ'), ('レトロ建築'), ('高架') on conflict (name) do nothing;

-- 大日影トンネル遊歩道
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '大日影トンネル遊歩道', '1903年に開通した中央本線の鉄道トンネル。1997年に隣に新しいトンネルができて使われなくなり、今は全長約1.4kmの遊歩道として無料で歩ける。レンガの壁と蒸気機関車の煤、レールや標識が当時のまま残り、照明が等間隔に続く一直線の通路を、片道約30分かけて歩いていく。', 'JR中央本線「勝沼ぶどう郷」駅から徒歩約5分（甲州市の観光サイト）。9:00〜16:00、無料。年末年始（12/29〜1/3）は通れない（甲州市）。片道30分ほどかかるので、時間に余裕を持って。', 35.66988, 138.74384, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '大日影トンネル遊歩道')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '山梨', 'トンネル', '廃線跡')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/tsukihitokinako/status/2096428908006813784', 'https://pbs.twimg.com/media/HRgC-YTa0AAa6e6.jpg', 0),
  ('https://x.com/8010Teardrop/status/1530060166711742464', 'https://pbs.twimg.com/media/FTvdksdUcAA0zpt.jpg', 1)
) as v(url, thumb, pos);

-- 清津峡渓谷トンネル
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '清津峡渓谷トンネル', '1988年の落石事故で通れなくなった渓谷の遊歩道の代わりに、1996年に造られた全長750mの歩行者用トンネル。2018年の大地の芸術祭で、マ・ヤンソン／MADアーキテクツの作品「Tunnel of Light」として改修された。色の変わる照明が続く長い通路の先、終点のパノラマステーションでは、水を張った床に渓谷と人影が鏡のように映る。', 'JR越後湯沢駅から急行バスで約25分の「清津峡入口」から徒歩約30分。8:30〜17:00（12〜2月は9:00〜16:00）、一般1,200円（11/21〜4/20は1,000円）。連休などは予約制の日がある（清津峡渓谷トンネル公式サイト）。人の少ない写真なら平日の朝。', 36.9725, 138.74981, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '清津峡渓谷トンネル')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '新潟', 'トンネル')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/to_kanko/status/2016352261505790388', 'https://pbs.twimg.com/media/G_uEdckbAAAM7lC.jpg', 0),
  ('https://x.com/sjNyIwtcyF509/status/2101504092736716975', 'https://pbs.twimg.com/media/HSoK0sFbYAAc1vn.jpg', 1)
) as v(url, thumb, pos);

-- 富岩運河環水公園 天門橋
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '富岩運河環水公園 天門橋', '運河の船だまりの跡に1997年に開かれた、水辺の人工的な公園。1999年に完成した天門橋の両端には、高さ約20mの展望塔が立ち、塔と塔は釣り糸でできた「赤い糸電話」でつながっている。夜や早朝、人のいない水面に橋の明かりだけが映る時間には、誰かのために用意されたまま忘れられた舞台のような静けさがある。', '富山駅の北口から徒歩約9分（富山市観光協会）。公園は終日入れる。展望塔は9:00〜21:30、無料。', 36.7092, 137.21216, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '富岩運河環水公園 天門橋')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '富山', '広場', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/kitomorisan/status/2007659846112555420', 'https://pbs.twimg.com/media/G9yjnSRasAEnf-A.jpg', 0),
  ('https://x.com/LENOZOMBIE/status/1480522113832615936', 'https://pbs.twimg.com/media/FIveGLmaUAkUIZc.jpg', 1)
) as v(url, thumb, pos);

-- 金沢海みらい図書館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '金沢海みらい図書館', '2011年に開館した、シーラカンスK&H（堀場弘・工藤和美）設計の図書館。白い箱のような外壁に約6,000個の丸窓が並び、天井の高い大きな空間に、点のような光が静かに落ちてくる。郊外の広い空の下に置かれた白い箱は、外から眺めても、どこか現実から少し離れた建物に見える。', '北陸鉄道バス「金沢海みらい図書館前」下車すぐ。平日10:00〜19:00、土日祝10:00〜17:00、水曜休館、入館無料（金沢市図書館）。館内の撮影は事務室で撮影許可証をもらう必要があり、図書コーナーは撮影できない。', 36.59434, 136.60429, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '金沢海みらい図書館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '石川', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/12011Bot/status/1431745716913803267', 'https://pbs.twimg.com/media/DddDNODVAAASwux.jpg', 0),
  ('https://x.com/hihillstyle/status/2017791916679811109', 'https://pbs.twimg.com/media/HAChiCJawAAK_B5.jpg', 1)
) as v(url, thumb, pos);

-- 金沢21世紀美術館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '金沢21世紀美術館', '2004年に開館した、SANAA（妹島和世・西沢立衛）設計の美術館。芝生の真ん中に直径112.5mの円形のガラスの建物が置かれ、白い通路と中庭が迷路のようにつながる。無料の交流ゾーンは夜22時まで開いていて、人の減った夜には、どちらが表でどちらが裏なのか分からなくなる。', 'JR金沢駅からバスで「広坂・21世紀美術館」下車。交流ゾーンは9:00〜22:00で無料、展覧会ゾーンは10:00〜18:00（金・土は20:00まで）、月曜休場（公式サイト）。フラッシュ・三脚・自撮り棒は禁止。2027年5月から大規模修繕で休館する予定。', 36.56084, 136.65821, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '金沢21世紀美術館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '石川', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/iinicknohi1/status/1853636759156125894', 'https://pbs.twimg.com/media/GblwzXJaUAA-M_v.jpg', 0),
  ('https://x.com/aska0623/status/2104221533640261952', 'https://pbs.twimg.com/media/HTOyPO8awAA776S.jpg', 1)
) as v(url, thumb, pos);

-- 茅野市民館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '茅野市民館', '2005年に開館した、古谷誠章設計の文化施設。茅野駅の橋上駅舎から通路がそのまま建物の中へ続き、駅と建物の境目がはっきりしない。駅のホームに沿って細長く延びる図書室は、高さ5mの全面ガラス張り。列車を待つ場所と本を読む場所が一枚のガラスを隔てて並ぶ、通り過ぎるための空間。', 'JR中央本線「茅野」駅の東口から通路で直結。9:00〜20:00、火曜休館（公式サイト）。図書室や催しの来場者を写さないように。', 35.99517, 138.15251, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '茅野市民館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '長野', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/rekainama/status/2017551244588720402', 'https://pbs.twimg.com/media/G__IKRsbcAA4iZT.jpg', 0),
  ('https://x.com/zqioTceBsozUjeT/status/2031936752446066908', 'https://pbs.twimg.com/media/HDLjs54akAAD2_d.jpg', 1)
) as v(url, thumb, pos);

-- 朱鷺メッセ Befcoばかうけ展望室
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '朱鷺メッセ Befcoばかうけ展望室', '新潟港に面した朱鷺メッセの万代島ビル31階、地上約125mにある無料の展望室。ビルは2003年に完成した。ガラスに囲まれた静かなフロアからは、夜になると街の灯りと暗い日本海だけが見える。人の少ない夜の展望室は、どこへも向かわない待合室のように静まり返る。', 'JR新潟駅バスターミナルから「朱鷺メッセ・佐渡汽船線」で約16分、新潟駅万代口から徒歩約20分。8:00〜22:00、無料（ホテル日航新潟）。イベントの日は時間が変わることがある。', 37.92616, 139.06, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '朱鷺メッセ Befcoばかうけ展望室')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '新潟', '平成レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/iiShunn_/status/1768255474175267151', 'https://pbs.twimg.com/media/GIoa5hyb0AAcJhG.jpg', 0),
  ('https://x.com/fukusmilep4/status/1862410050054365512', 'https://pbs.twimg.com/media/GdicEUDWkAAcMej.jpg', 1)
) as v(url, thumb, pos);

-- サンライズなは商店街
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'サンライズなは商店街', '那覇・国際通りの裏手、市場本通りから開南の方へ延びるアーケード商店街。1950年代から続き、1988年にアーケードが架けられた。観光客でにぎわう通りから一本外れるだけで、閉じたシャッターと古い看板、蛍光灯の下に小さな店が点々と続く、観光地の裏側に迷い込んだような通りになる。', 'ゆいレール「牧志」駅から徒歩約9分。国際通りや平和通りから歩いて入れる公道のアーケード。店や店の人を写さないように。', 26.21278, 127.68906, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'サンライズなは商店街')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', '商店街', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/futanaritakara/status/1329341873123586048', 'https://pbs.twimg.com/media/EnLFYlbVkAEGSUV.jpg', 0),
  ('https://x.com/tomo_sameshima/status/1670733955568652288', 'https://pbs.twimg.com/media/Fy-jm-yacAEFwOt.jpg', 1)
) as v(url, thumb, pos);

-- コザ一番街（中央一番街）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'コザ一番街（中央一番街）', '沖縄市コザにある、長さ約300mのアーケード商店街。1970年代半ばに沖縄で初めてアーケードが架けられ、1960〜70年代には沖縄中部でいちばんの商業地だった。1990年代以降は閉じた店が目立つようになり、今は新しい店と閉じたままの店が交互に並ぶ。長い屋根の下の静けさが、にぎやかだった頃の残響のように感じられる。', '沖縄市中央1丁目。路線バスで「胡屋」バス停周辺へ。公道のアーケードで誰でも通れる。店や住民を写さないように。', 26.33641, 127.80048, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'コザ一番街（中央一番街）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', '商店街', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/daikan_47/status/2006333102256467970', 'https://pbs.twimg.com/media/G9ftUkKbUAExLtd.jpg', 0),
  ('https://x.com/KOZAFILMOFFICE/status/1511179317518032901', 'https://pbs.twimg.com/media/FNDu_OeVIAAazy2.jpg', 1)
) as v(url, thumb, pos);

-- 名護市庁舎
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '名護市庁舎', '1981年に完成した、象設計集団（Team Zoo）設計の市庁舎。全国から308案が集まった設計競技で選ばれ、日本建築学会賞を受けた。コンクリートブロックの格子と日よけの棚が段々に重なり、建物のあちこちに風の通る半屋外の空間がある。人のいない休日や夕方、段状のテラスと長いスロープに風だけが抜けていく様子は、役所とも集落ともつかない不思議な空間に見える。', 'バス「名護市役所前」下車すぐ。開庁は平日8:30〜17:15（名護市）。今も使われている庁舎なので、職員や来庁者を写さないように。', 26.59156, 127.97744, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '名護市庁舎')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', 'レトロ建築', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/a9JLpkhiG9PXQO0/status/1997059380186173874', 'https://pbs.twimg.com/media/G7b61XgbQAAyruJ.jpg', 0),
  ('https://x.com/afr_memory/status/1501533460535844869', 'https://pbs.twimg.com/media/FNaD6leaIAAYUrq.jpg', 1)
) as v(url, thumb, pos);

-- 波の上ビーチ
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '波の上ビーチ', '那覇市の街なかにある、市内でただひとつの海水浴場。1991年に造られた人工のビーチで、すぐ目の前の海の上を高架の道路が横切り、岩の上には波上宮が立つ。泳ぐ人のいない早朝や夜、南の島の砂浜が高架とコンクリートに囲まれて、どこか作り物めいた風景に見える。', 'バス「西武門」または「久米孔子廟前」から徒歩約5分（公式サイト）。遊泳は4〜10月の9:00〜18:00。泳いでいる人を写さないように。台風のときは閉鎖されることがある。', 26.22108, 127.67206, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '波の上ビーチ')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', '高架')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/39_twit_okinawa/status/1389335701389398016', 'https://pbs.twimg.com/media/E0fpbdGUcAA2aa3.jpg', 0),
  ('https://x.com/pD7FrigQU1PSyDX/status/1732351756418584911', 'https://pbs.twimg.com/media/GAqMu3paQAAeA_I.jpg', 1)
) as v(url, thumb, pos);

-- 海中道路（海の駅あやはし館）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '海中道路（海の駅あやはし館）', 'うるま市の与勝半島と平安座島を結ぶ、遠浅の海に土手を築いた約5kmの道路。1972年に開通した。両側に空と浅い海だけが広がる一本道の途中に、広い駐車場と海の駅がぽつんと浮かぶ。人の少ない平日の夕方には、どこにも着かない道を走り続けているような感覚になる。', '沖縄自動車道・沖縄北ICから車で約25分。海の駅あやはし館は9:00〜17:30（公式サイト）。道路の上で車を止めたり、車道に出て撮影したりしないこと。撮るなら海の駅や中央の広場から。', 26.33225, 127.92921, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '海中道路（海の駅あやはし館）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/SleepdeeplyGG/status/2059928123031073215', 'https://pbs.twimg.com/media/HJZVtMnaEAEhy_8.jpg', 0),
  ('https://x.com/OKIRIP_/status/1880204760969802004', 'https://pbs.twimg.com/media/GhfUMhLacAAQ-YZ.jpg', 1)
) as v(url, thumb, pos);

-- 海洋文化館（海洋博公園）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '海洋文化館（海洋博公園）', '1975年の沖縄国際海洋博覧会で、政府の展示館として建てられた建物。博覧会の跡地に造られた広い公園の一角で、今も公開されている。展示の多くは博覧会のときに作られたもので、大きなカヌーや半世紀前の展示が静かに並ぶ館内は、終わったお祭りの続きの中にいるような感覚になる。', '那覇空港から高速バスで約2時間〜2時間40分、「記念公園前」下車、徒歩約5分。8:30〜17:30、大人190円（公園の入園は無料。海洋博公園）。水曜は公園の一部の施設が休みになる日がある。', 26.69034, 127.878, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '海洋文化館（海洋博公園）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', '昭和レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/626_tiana/status/1621382722882252802', 'https://pbs.twimg.com/media/FoBO_U2aIAAh0G1.jpg', 0),
  ('https://x.com/satoh_sama4/status/2001151574467551351', 'https://pbs.twimg.com/media/G8WEqn8a4AEMJKf.jpg', 1)
) as v(url, thumb, pos);

-- ユーグレナモール（石垣市）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'ユーグレナモール（石垣市）', '石垣島の中心にある、日本でいちばん南のアーケード商店街。1988年と1989年に2本のアーケードが架けられ、あいだに公設市場がはさまる。昼は観光客でにぎわうが、店が開く前の朝や閉まったあとには、南の島の強い日差しを屋根がさえぎった、薄暗く長い通路だけが残る。', '石垣港離島ターミナルから徒歩約5分。公道のアーケードで誰でも通れる。店や店の人を写さないように。', 24.33947, 124.15797, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'ユーグレナモール（石垣市）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '沖縄', '商店街')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/NItpegeduq7yBFe/status/1396404654980747268', 'https://pbs.twimg.com/media/E2EGnLQVEAA7B_w.jpg', 0),
  ('https://x.com/doughimself/status/1287610679365533696', 'https://pbs.twimg.com/media/Ed6DFOCUcAARm6A.jpg', 1)
) as v(url, thumb, pos);

-- 5aju7DnF 川内三十人町の豪邸（個人の住宅跡で、住民のプライバシーに配慮して非公開にする（元に戻せる））
update public.spots set status = 'hidden', updated_at = now()
where slug = '5aju7DnF' and status = 'published';

commit;

-- 確認用：追加した14件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('大日影トンネル遊歩道', '清津峡渓谷トンネル', '富岩運河環水公園 天門橋', '金沢海みらい図書館', '金沢21世紀美術館', '茅野市民館', '朱鷺メッセ Befcoばかうけ展望室', 'サンライズなは商店街', 'コザ一番街（中央一番街）', '名護市庁舎', '波の上ビーチ', '海中道路（海の駅あやはし館）', '海洋文化館（海洋博公園）', 'ユーグレナモール（石垣市）')
order by s.created_at;
