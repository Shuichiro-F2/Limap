-- 北海道の公式スポット7件を追加し、既存の北海道スポット4件の文章を直す（記事「北海道のリミナルスペース」用。2026-09-28）
--
-- 追加する7件は、どれも今も誰でも行ける場所（地下歩行空間・地下街・公園・野外博物館・廃線跡の散策路・資料館・記念館）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 札幌駅前通地下歩行空間（チ・カ・ホ）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '札幌駅前通地下歩行空間（チ・カ・ホ）', 'JR札幌駅と大通を結ぶ、約520mのまっすぐな地下の歩行空間。2011年3月に開通した。幅12mの通路の両側に広場がとられ、白い柱と天井の天窓から落ちる光が、同じ間隔でどこまでも続いていく。人の少ない早朝には、終わりの見えない広い廊下だけがそこに残される。', 'JR札幌駅・地下鉄さっぽろ駅と地下鉄大通駅のあいだ、札幌駅前通の真下。通れるのは5:45〜24:30で、それ以外の時間は通行できない（公式サイト）。', 43.06275, 141.35139, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '札幌駅前通地下歩行空間（チ・カ・ホ）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', '地下通路', '地下', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/inthecitynight/status/1675973009595858944', 'https://pbs.twimg.com/media/F0JAi37aMAEaNEL.jpg', 0),
  ('https://x.com/masatohama0324/status/1896318754835095794', 'https://pbs.twimg.com/media/GlET2YJWQAAyQMj.jpg', 1)
) as v(url, thumb, pos);

-- さっぽろ地下街 ポールタウン
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'さっぽろ地下街 ポールタウン', '大通からすすきのまで、地下鉄南北線の上に約400mまっすぐ続く地下街。札幌オリンピックの前年、1971年に開業した。日中は人で埋まる通路も、店のシャッターが下りた時間や全館休業の日には、同じような店先が並ぶ長い地下道だけになり、どこまで歩いても景色が変わらない。', '地下鉄「大通」駅と「すすきの」駅のあいだの地下。店の営業は10:00〜20:00（公式サイト）。私有の商業施設なので、店や通る人を写さないように。', 43.05722, 141.35278, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'さっぽろ地下街 ポールタウン')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', '地下街', '地下', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/nape0404/status/1988710078355239250', 'https://pbs.twimg.com/media/G5lRRCoa0AANvhA.jpg', 0),
  ('https://x.com/sakkurusan/status/1759399018252390519', 'https://pbs.twimg.com/media/GGqkDFQaoAAbb9R.jpg', 1)
) as v(url, thumb, pos);

-- モエレ沼公園
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'モエレ沼公園', 'ごみの埋立地だった場所に、彫刻家イサム・ノグチの基本計画で「公園全体をひとつの彫刻」として造られた公園。2005年にグランドオープンした。人工の山、ガラスのピラミッド、まっすぐな並木と広い芝生。幾何学的な形だけが大きな空の下に置かれ、人の少ない時間には、誰かが用意したまま忘れていった舞台のように見える。', '地下鉄東豊線「環状通東」駅から中央バスで「モエレ沼公園東口」または「モエレ沼公園西口」下車。東口は7:00〜22:00に開いている（西口・南口は時間が短い。公式サイト）。とても広いので、季節と天候に注意。', 43.1225, 141.43111, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'モエレ沼公園')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', '広場', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/yuya0240/status/2062820470844715453', 'https://pbs.twimg.com/media/HJzex6IbsAA-rzB.jpg', 0),
  ('https://x.com/mia02280228/status/2103414925297385702', 'https://pbs.twimg.com/media/HTDUo1HaEAEyGYy.jpg', 1)
) as v(url, thumb, pos);

-- 北海道開拓の村
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '北海道開拓の村', '明治から昭和のはじめまでの北海道の建物を移築・再現して並べた野外博物館。1983年に開村し、約54haの敷地に52棟の建物が建つ。役場や商店、駅舎が並ぶ通りに住む人はおらず、馬車鉄道の線路だけがまっすぐ延びている。人の少ない日には、町並みごと時代から切り離された舞台装置のように見える。', '新札幌バスターミナル（JR新札幌駅・地下鉄新さっぽろ駅）からJR北海道バス「開拓の村」行きで約20分、終点下車。9:00〜17:00（10〜4月は16:30まで）、月曜休村、一般1,000円（公式サイト）。SNSのライブ配信やドローンは禁止。', 43.04828, 141.49706, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '北海道開拓の村')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/switchback87/status/1451804778015510530', 'https://pbs.twimg.com/media/FCXYsjMVkAQvfj2.jpg', 0),
  ('https://x.com/fujisawa_uruu/status/1684924991383781376', 'https://pbs.twimg.com/media/F2INE1UagAAl1Fc.jpg', 1)
) as v(url, thumb, pos);

-- 旧手宮線跡（小樽）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '旧手宮線跡（小樽）', '1880年に開業した北海道で最初の鉄道の一部で、1985年に廃止された手宮線の跡。線路は撤去されずに残され、小樽の街なかの約1.6kmが散策路として整備されている。もう列車の来ないレールと踏切が、建物のあいだをまっすぐ延びていく。', 'JR小樽駅から徒歩約15分（小樽観光協会）。寿司屋通りから小樽市総合博物館までの区間が散策路で、通年歩ける。道路と交わる場所では車に注意。', 43.19765, 140.9992, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '旧手宮線跡（小樽）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', '廃線跡')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/JrJr47919919/status/1718893356942815697', 'https://pbs.twimg.com/media/F9q8ZPLb0AARPTz.jpg', 0),
  ('https://x.com/kame__pyon/status/1936489281910116548', 'https://pbs.twimg.com/media/Gt_KpDkWYAMmgCK.jpg', 1)
) as v(url, thumb, pos);

-- 日本銀行旧小樽支店金融資料館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '日本銀行旧小樽支店金融資料館', '銀行が建ち並び「北のウォール街」と呼ばれた小樽・色内に、1912年に建てられた日本銀行の支店。辰野金吾の指導のもと、長野宇平治・岡田信一郎が設計した。2002年に支店が廃止されたあと、金融資料館として無料で公開されている。吹き抜けの旧営業室や大きな金庫の扉が残る館内には、役目を終えた銀行の静けさが漂う。', '小樽市色内1-11-16、旧手宮線跡のすぐ近く。4〜11月は9:30〜17:00、12〜3月は10:00〜17:00、水曜休館、入館無料（公式サイト）。フラッシュ・三脚は使わないように。', 43.19619, 141.00033, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '日本銀行旧小樽支店金融資料館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/sakuramaya11/status/1461840461153255425', 'https://pbs.twimg.com/media/FEYxtP_aQAE8FXr.jpg', 0),
  ('https://x.com/Lupin_amilcna/status/2102612924770725972', 'https://pbs.twimg.com/media/HS37QtAb0AAtv8p.jpg', 1)
) as v(url, thumb, pos);

-- 函館市青函連絡船記念館摩周丸
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '函館市青函連絡船記念館摩周丸', '1965年に就航し、1988年3月の青函航路の廃止まで青森と函館を結んだ連絡船。今も函館駅近くの岸壁に係留されたまま、記念館として公開されている。並んだ座席、操舵室、無線通信室。二度と出航しない船の中には、最後の航海を終えたあとの時間がそのまま流れている。', 'JR函館駅から徒歩約3分。4〜10月は8:30〜18:00、11〜3月は9:00〜17:00、年中無休、一般500円（函館市）。船舶検査などで臨時休館することがある。', 41.77294, 140.72189, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '函館市青函連絡船記念館摩周丸')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '北海道', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/nerdtabi/status/2016453520422297616', 'https://pbs.twimg.com/media/G_vgUbyXcAA7ejL.jpg', 0),
  ('https://x.com/asm_390/status/2002215076695322680', 'https://pbs.twimg.com/media/G8lL_IsbYAAlfkd.jpg', 1)
) as v(url, thumb, pos);

-- 既存の公式スポットの文章の修正（今の文章が確認時と同じとき＝md5 が一致するときだけ書き換える）

-- 3ZXPPqYu シャトレーゼ ガトーキングダム サッポロ（誤字「隱れた」）
update public.spots set description = '旧札幌テルメを前身とするリゾートホテル「ガトーキングダムサッポロ」。屋内プールや大浴場へ向かう通路、食堂施設周辺は、人の波が引いた瞬間にプールコア・リミナルスペース感がMAXになるとSNSで評判の隠れた名所。旧テルメ時代からのレトロな建築様式が、どこか懐かしくて不思議な雰囲気を作り出している。', updated_at = now()
where slug = '3ZXPPqYu' and md5(description) = '2a546a7970eef7d0f8feb981e1c82886';

-- BQQBELWM タウシュベツ川橋梁（幻の橋）（誤字「だがが」）
update public.spots set description = '旧国鉄士幌線の廃線橋。糠平湖のダム建設により水没する運命にありながら、季節ごとの水位変動で夏は湖底に沈み、冬から春にかけて再びその姿を現すことから「幻の橋」と呼ばれる。崩落が年々進み、いつ崩れ落ちてもおかしくない状態だが、無人の湖面に浮かぶアーチ群と鏡のような水鏡が、失われゆく時間そのものを映し出しているようで見る者を圧倒する。', updated_at = now()
where slug = 'BQQBELWM' and md5(description) = 'a5caae6984b61843449abad51e3c83c1';

-- vHoKaWez 常紋トンネル（句読点の誤り）
update public.spots set description = '明治末から大正初期（1912〜1914年）にかけて、タコ部屋労働と多数の犠牲者を出した難工事の末に開通した石北本線の鉄道トンネル。人柱伝説が語り継がれ、1970年の改修工事では実際に壁の中から人骨が見つかっている。今も深い山中でひっそりと口を開ける。雪に閉ざされた坑口をディーゼルカーが行き交う光景は、時代から取り残されたような静けさをたたえている。', updated_at = now()
where slug = 'vHoKaWez' and md5(description) = '79d0a2897b8b9141556edab58db10eff';

-- 4y7VrgGL 定山渓温泉ホテル山渓苑（廃旅館）（立ち入りを誘う書き方を改め、外から眺めるだけの注意を添える）
update public.spots set description = '定山渓温泉街のすぐそばに建つ、営業を終えた大型旅館。すぐ隣では今も温泉街のにぎわいが続いているのに、この一角だけが時間から取り残されたように静止している。その落差が、この場所ならではのリミナルな感覚を生んでいる。私有の建物のため、敷地には入らず外から眺めるだけにしたい。', updated_at = now()
where slug = '4y7VrgGL' and md5(description) = 'd5fded6d23a2e24dc4def787ba3a2818';

commit;

-- 確認用：追加した7件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('札幌駅前通地下歩行空間（チ・カ・ホ）', 'さっぽろ地下街 ポールタウン', 'モエレ沼公園', '北海道開拓の村', '旧手宮線跡（小樽）', '日本銀行旧小樽支店金融資料館', '函館市青函連絡船記念館摩周丸')
order by s.created_at;
