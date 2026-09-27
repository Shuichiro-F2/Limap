-- 北関東（茨城・栃木・群馬）の公式スポット7件と、静岡・東海（静岡・岐阜・三重）の公式スポット7件を追加する
-- （記事「北関東のリミナルスペース」「静岡・東海のリミナルスペース」用。2026-09-28）
--
-- 追加する14件は、どれも今も誰でも行ける場所（広場・展望タワー・地下採掘場跡・県庁の展望室・音楽ホール・廃線跡の遊歩道・
-- 美術館・体験型の作品・アーケード商店街・複合施設・港の展望室・駅）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 使うタグ（まだ無いものだけ作られる）
insert into public.tags (name) values ('リミナルスペース'), ('茨城'), ('広場'), ('計画都市'), ('平成レトロ'), ('公共施設'), ('栃木'), ('地下'), ('産業遺産'), ('群馬'), ('高層ビル街'), ('レトロ建築'), ('昭和レトロ'), ('廃線跡'), ('橋'), ('トンネル'), ('静岡'), ('岐阜'), ('異世界レジャー'), ('商店街'), ('三重'), ('駅') on conflict (name) do nothing;

-- つくばセンター広場
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'つくばセンター広場', '筑波研究学園都市の中心に、1983年に完成したつくばセンタービルの広場。設計は磯崎新で、ローマのカンピドリオ広場を反転させ、周りより一段低く沈めた楕円形の広場の中心に噴水を置いている。石の階段と壁に囲まれた広場は、イベントのない平日の早朝や雨の夜、誰かのために用意された舞台にひとりだけ取り残されたような静けさになる。', 'つくばエクスプレス「つくば」駅A3出口から徒歩約3分。屋外の広場で出入りは自由。週末はイベントでにぎわうことが多い。', 36.08182, 140.11372, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'つくばセンター広場')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '茨城', '広場', '計画都市')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/tsukuba_center5/status/1754479735877599561', 'https://pbs.twimg.com/media/GFkqArDbkAAEVgK.jpg', 0)
) as v(url, thumb, pos);

-- 水戸芸術館 シンボルタワー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '水戸芸術館 シンボルタワー', '1990年に開館した水戸芸術館の、高さ100mの塔。設計は磯崎新で、正三角形のチタンのパネルをねじるように積み上げた、らせん状の形をしている。ガラス張りのエレベーターで上がる地上86.4mの展望室は定員19名の小さな部屋で、潜水艦のような窓から街を見下ろすと、幾何学の中に閉じ込められたような気分になる。', 'JR水戸駅北口からバスで約10分、「泉町1丁目」から徒歩2分。塔は平日9:30〜18:00、土日祝9:30〜19:00、月曜休館、大人200円（公式サイト）。悪天候の日は上れないことがある。', 36.38028, 140.46583, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '水戸芸術館 シンボルタワー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '茨城', '平成レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/hiro_kawajiri/status/2013239584755532180', 'https://pbs.twimg.com/media/G_B2Vpsb0AAvv3n.jpg', 0),
  ('https://x.com/kanomegu0726/status/1879416521690427652', 'https://pbs.twimg.com/media/GhUHWpuacAEwehz.jpg', 1)
) as v(url, thumb, pos);

-- 大谷資料館（大谷石地下採掘場跡）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '大谷資料館（大谷石地下採掘場跡）', '1919年から1986年まで、約70年かけて大谷石を掘り出した跡の地下空間。広さは約2万㎡、深いところで地下60mに達し、坑内は1年を通して8℃前後に保たれている。直線で切り出された巨大な石の壁と柱が、薄暗い照明の中にどこまでも続き、地底に置き忘れられた神殿に迷い込んだような空間になっている。', 'JR宇都宮駅西口からバスで約30分、「資料館入口」から徒歩約5分。4〜11月は9:00〜17:00、12〜3月は9:30〜16:30（12〜3月は火曜休館）。大人1,000円、現金のみ（公式サイト）。坑内は1年中寒いので上着を。', 36.59996, 139.82475, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '大谷資料館（大谷石地下採掘場跡）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '栃木', '地下', '産業遺産')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/akimizu/status/1728027026026840144', 'https://pbs.twimg.com/media/F_svLD6awAAydT0.jpg', 0),
  ('https://x.com/oyashiryokan/status/2022608079922303176', 'https://pbs.twimg.com/media/HBG_U5XakAEphuZ.jpg', 1)
) as v(url, thumb, pos);

-- 栃木県庁 15階展望ロビー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '栃木県庁 15階展望ロビー', '2007年に完成した栃木県庁本館の最上階にある、回廊式の展望ロビー。地上約65mのガラス張りの廊下が建物をぐるりと囲み、平日も休日も夜9時まで無料で開放されている。閉庁後、人のいない役所の廊下から宇都宮の夜景を眺める時間は、少しだけ現実から外れた場所にいるように感じる。', '東武宇都宮駅から徒歩約12分。平日8:30〜21:00、土日祝10:00〜21:00、無料（栃木県）。今も使われている県庁なので、職員や来庁者を写さないように。', 36.56544, 139.88353, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '栃木県庁 15階展望ロビー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '栃木', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/towerup_tw/status/2030200768817766577', 'https://pbs.twimg.com/media/HCy40_TbIAACRcL.jpg', 0),
  ('https://x.com/naoki_youtube_/status/1739942861750059172', 'https://pbs.twimg.com/media/GCWEywSaEAAhb5z.jpg', 1)
) as v(url, thumb, pos);

-- 群馬県庁 32階展望ホール
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '群馬県庁 32階展望ホール', '1999年に完成した、高さ153.8mの群馬県庁の32階にある展望ホール。地上127mのフロア全体が無料で開放され、夜10時まで入れる。人のいない夜のフロアから、上毛三山と関東平野の灯りを見下ろしていると、役所の中にいることを忘れてしまう。', 'JR両毛線「前橋」駅からバスで約6分。平日8:30〜22:00、土日祝9:00〜22:00、無料（群馬県）。カフェが併設されているので、利用者を写さないように。', 36.39067, 139.06044, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '群馬県庁 32階展望ホール')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '群馬', '高層ビル街', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/culdcepco/status/1684902900894752768', 'https://pbs.twimg.com/media/F2H6QbzbYAAJNL_.jpg', 0),
  ('https://x.com/eiko09082028/status/1974827171014406237', 'https://pbs.twimg.com/media/G2f-11sbMAETmLv.jpg', 1)
) as v(url, thumb, pos);

-- 群馬音楽センター
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '群馬音楽センター', '1961年に完成した、アントニン・レーモンド設計の音楽ホール。建設費3億円のうち1億円を市民の寄付でまかない、屏風を折ったようなコンクリートの折板構造で、柱のない大きな客席を覆っている。催しのない見学日には、照明を落としたままの誰もいない客席とロビーを歩くことができ、昭和の公共建築の気配だけが静かに残っている。', 'JR高崎駅西口から徒歩約10分。館内の見学は催しのない指定日だけ（9:00〜17:00、入口正面の事務所で受付）。見学日は高崎財団のサイトで確認を。外観はいつでも見られる。', 36.32351, 139.00361, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '群馬音楽センター')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '群馬', 'レトロ建築', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/binokyojintachi/status/1678368890844499968', 'https://pbs.twimg.com/media/F0rDm4AagAAFTlx.jpg', 0),
  ('https://x.com/toru_master2/status/1893545722026566072', 'https://pbs.twimg.com/media/Gkc5yZ8bEAAmOWX.jpg', 1)
) as v(url, thumb, pos);

-- 碓氷第三橋梁（めがね橋）とアプトの道
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '碓氷第三橋梁（めがね橋）とアプトの道', '1893年に完成した、旧信越本線のレンガ造りのアーチ橋。長さ91m、川底からの高さ31mで、約200万個のレンガが使われている。廃線になった線路跡は、横川駅から熊ノ平駅跡までの約6kmが遊歩道「アプトの道」になり、橋の上やいくつものトンネルを歩いて通り抜けられる。列車の来なくなった線路跡を歩いていると、役目を終えた通路の途中に取り残されたような気分になる。', 'JR信越本線「横川」駅からバスで約13分、またはアプトの道を徒歩約1時間。アプトの道は通年・終日通れる（安中市）。トンネル内の照明は7:00〜18:00だけなので、暗くなってからは歩かないこと。', 36.35799, 138.69827, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '碓氷第三橋梁（めがね橋）とアプトの道')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '群馬', '廃線跡', '橋', 'トンネル')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/ses_are_ses/status/1521764931758034944', 'https://pbs.twimg.com/media/FR5lF52VUAITeqI.jpg', 0),
  ('https://x.com/karakorum_3/status/1444515904646123520', 'https://pbs.twimg.com/media/FAvzglLUcAkdV8Y.jpg', 1)
) as v(url, thumb, pos);

-- 静岡県庁別館 21階 富士山展望ロビー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '静岡県庁別館 21階 富士山展望ロビー', '1996年に完成した静岡県庁別館の最上階、21階にある展望ロビー。予約も受付もなしで誰でも無料で上がれ、晴れた日には富士山や駿河湾が見える。平日の夕方など人の少ない時間には、役所らしい飾り気のない内装と、窓一面の景色だけが妙に静かに広がる。', 'JR静岡駅北口から徒歩約15分。青葉駐車場側の入口のエレベーターで21階へ。平日8:30〜18:00、土日祝10:00〜18:00、無料。毎月第3土曜とその翌日の日曜、年末年始は休館（静岡県）。', 34.97698, 138.38368, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '静岡県庁別館 21階 富士山展望ロビー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '静岡', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/sizohkasizohka/status/2011429461896663189', 'https://pbs.twimg.com/media/G-oIbX0bkAAoXyj.jpg', 0),
  ('https://x.com/s_aniotama/status/1353601377344217089', 'https://pbs.twimg.com/media/Esj1M1WVcAIIu0O.jpg', 1)
) as v(url, thumb, pos);

-- MOA美術館 エスカレーター通路と円形ホール
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'MOA美術館 エスカレーター通路と円形ホール', '1982年に開館した熱海の美術館。入口から山の上の本館まで、高低差48.5mを上下8基のエスカレーターで上っていく。光の色が変わる長いエスカレーターの通路と、途中にある直径約20mの地下のドームは、行き先の見えない光の中を延々と移動していく空間になっている。', 'JR熱海駅バスターミナル8番乗り場から「MOA美術館行」バスで約7分。9:30〜16:30、木曜休館、一般2,000円（公式サイト）。フラッシュ・三脚・自撮り棒は館内すべて禁止。', 35.10926, 139.07533, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'MOA美術館 エスカレーター通路と円形ホール')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '静岡', '地下', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/i_mMmU3/status/1895483268423921845', 'https://pbs.twimg.com/media/Gk4b-u4WIAAXl_6.jpg', 0),
  ('https://x.com/VG6zkq06V5UkKdX/status/1965350649522266351', 'https://pbs.twimg.com/media/G0ZT7lhbMAA4c6j.jpg', 1)
) as v(url, thumb, pos);

-- 養老天命反転地
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '養老天命反転地', '美術家の荒川修作とマドリン・ギンズが構想し、1995年に開園した体験型の作品。すり鉢状の地面に、傾いた壁や曲がりくねった148本の通路、5つの日本列島の模型が広がり、平衡感覚が少しずつずれていく。人の少ない時間に斜面や迷路のような通路を歩いていると、夢の中の地形に迷い込んだように感じる。', '養老鉄道「養老」駅から徒歩約10分。9:00〜17:00、火曜休園、大人850円（養老公園）。斜面やくぼ地があるので歩きやすい靴で。', 35.28262, 136.55075, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '養老天命反転地')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '岐阜', '異世界レジャー')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/tef_tef_tef_/status/1995051953450311975', 'https://pbs.twimg.com/media/G6_ZKyHbgAAMCJD.jpg', 0),
  ('https://x.com/r_photolog/status/1794653844103991330', 'https://pbs.twimg.com/media/GOfkJI0aMAAmQIZ.jpg', 1)
) as v(url, thumb, pos);

-- 柳ケ瀬商店街（柳ケ瀬本通り）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '柳ケ瀬商店街（柳ケ瀬本通り）', '昭和の歌謡曲「柳ヶ瀬ブルース」で全国に名を知られた、岐阜市の繁華街。1960年に柳ケ瀬通りに県内で初めての全天候型アーケードが架けられた。百貨店が去ったあと、シャッターの目立つ長い屋根の下に、昼でも薄暗い通りが続いている。北側の一部のアーケードは、老朽化のため10年ほどかけて撤去される予定になっている。', 'JR岐阜駅からバスで約10分、「柳ケ瀬」下車すぐ。公道の商店街で誰でも通れる。店や通る人を写さないように。', 35.41938, 136.7573, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '柳ケ瀬商店街（柳ケ瀬本通り）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '岐阜', '商店街', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/RyosukeShibuya/status/1807691453529035154', 'https://pbs.twimg.com/media/GRY1yloawAAwWYI.jpg', 0),
  ('https://x.com/pa_p_a3/status/2099067058700931327', 'https://pbs.twimg.com/media/HSFG8sfboAAHJRe.jpg', 1)
) as v(url, thumb, pos);

-- セラミックパークMINO
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'セラミックパークMINO', '多治見市の丘陵の谷に、2002年に開館した陶磁器の複合施設。設計は磯崎新アトリエ・熊谷建築設計室で、石とタイルで覆われた巨大な建物と広場、長い通路が谷に沿って広がる。催しのない日にはほとんど人がおらず、建物だけが残った遺跡のような静けさがある。', 'JR多治見駅南口からバスで約15分、「セラパーク・現代陶芸美術館口」から徒歩約10分。屋外の広場や通路は、美術館に入らなくても歩ける。美術館は10:00〜18:00、月曜休館。', 35.33086, 137.15489, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'セラミックパークMINO')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '岐阜', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/miotatsumoto/status/1918898489553248595', 'https://pbs.twimg.com/media/GqFL_8iaoAAVX78.jpg', 0)
) as v(url, thumb, pos);

-- 四日市港ポートビル うみてらす14
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '四日市港ポートビル うみてらす14', '四日市港の開港100周年を記念して1999年に建てられた、高さ100mのポートビルの14階にある展望展示室。地上約90mの窓の外には、港と石油化学コンビナートが広がり、夜は工場群の光だけが静かにまたたく。平日の展望室は人が少なく、働き続ける工場を見下ろす、誰もいない部屋になる。', 'JR関西本線「富田浜」駅から徒歩約15分。10:00〜17:00（土日祝は21:00まで）、水曜休館（10・11月と祝日は開館）、一般310円（四日市港管理組合）。', 34.99334, 136.65757, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '四日市港ポートビル うみてらす14')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '三重', '平成レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/kobateck/status/1827327141534691693', 'https://pbs.twimg.com/media/GVv4V_Xa8AIudBR.jpg', 0),
  ('https://x.com/kinamomoyo/status/1619613630143803392', 'https://pbs.twimg.com/media/FnoGArVaEAIiAUZ.jpg', 1)
) as v(url, thumb, pos);

-- 近鉄 宇治山田駅
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '近鉄 宇治山田駅', '1931年に開業した、伊勢の玄関口の駅。設計は久野節で、幅128mの外壁はクリーム色のテラコッタのタイルで覆われ、屋根にはスペイン瓦が載る。国の登録有形文化財で、今も駅として使われている。伊勢参りの人の波が引いた夜、天井の高いコンコースには、いつの時代なのか分からなくなるような静けさが残る。', '近鉄山田線「宇治山田」駅。改札の外のコンコースは誰でも通れる。今も使われている駅なので、乗客や駅員の邪魔にならないように。', 34.4882, 136.71374, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '近鉄 宇治山田駅')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '三重', '駅', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/ddwnkmi/status/2104008407082795474', 'https://pbs.twimg.com/media/HTLweZ6aEAEpeS7.jpg', 0),
  ('https://x.com/binokyojintachi/status/2083545585253339345', 'https://pbs.twimg.com/media/HOo9qmAagAAgd1G.jpg', 1)
) as v(url, thumb, pos);

commit;

-- 確認用：追加した14件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('つくばセンター広場', '水戸芸術館 シンボルタワー', '大谷資料館（大谷石地下採掘場跡）', '栃木県庁 15階展望ロビー', '群馬県庁 32階展望ホール', '群馬音楽センター', '碓氷第三橋梁（めがね橋）とアプトの道', '静岡県庁別館 21階 富士山展望ロビー', 'MOA美術館 エスカレーター通路と円形ホール', '養老天命反転地', '柳ケ瀬商店街（柳ケ瀬本通り）', 'セラミックパークMINO', '四日市港ポートビル うみてらす14', '近鉄 宇治山田駅')
order by s.created_at;
