-- 九州（福岡・長崎）の公式スポット6件を追加し、既存の九州スポット2件の文章を直す（記事「九州のリミナルスペース」用。2026-09-28）
--
-- 追加する6件は、どれも今も誰でも行ける場所（海底の歩行者トンネル・地下街・展望タワー・渡し船・市道のエレベーター）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 関門トンネル人道
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '関門トンネル人道', '本州と九州を海の下で結ぶ、歩く人のためのトンネル。1958年に車道と同時に開通した。エレベーターで地下約60mまで下りると、蛍光灯に照らされた約780mの通路が、先が見えないほどまっすぐ延びている。途中の床には福岡県と山口県の県境の線が引かれ、行き交う人の少ない時間には、移動のためだけに造られた空間の静けさが際立つ。', '門司側の入口は西鉄バス「関門トンネル人道口」バス停のすぐ前（北九州市の観光サイト）。通れるのは6:00〜22:00、歩行者は無料。対岸の下関側にも入口がある。', 33.96129, 130.96305, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '関門トンネル人道')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福岡', '地下通路', 'トンネル', '地下', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/ri_nya222222/status/1880818552053354579', 'https://pbs.twimg.com/media/GhoCfrIa4AALY5Y.jpg', 0),
  ('https://x.com/kaitei_club/status/1502875675748798471', 'https://pbs.twimg.com/media/FNtJNgdVgAM-Xsf.jpg', 1)
) as v(url, thumb, pos);

-- 天神地下街
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '天神地下街', '福岡・天神の地下に約590m続く地下街。1976年に開業した。19世紀のヨーロッパをイメージした石畳の床と唐草模様の鉄の天井が続き、通路の照明はあえて暗めに抑えられている。店が閉まったあとや開く前の人のいない通路は、どこにも存在しない街の路地に迷い込んだように見える。', '地下鉄空港線「天神」駅・七隈線「天神南」駅と直結。通路は5:30〜25:00（日曜・祝日は24:30まで）に開いている（公式サイト）。私有の商業施設なので、店や通る人を写さないように。', 33.58995, 130.39957, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '天神地下街')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福岡', '地下街', '地下')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/pokerii_/status/2053572181096018110', 'https://pbs.twimg.com/media/HH_BAuUb0AAz5Zg.jpg', 0),
  ('https://x.com/si1ent7/status/1350084387514142722', 'https://pbs.twimg.com/media/Erx2lvHVkAQF0_j.jpg', 1)
) as v(url, thumb, pos);

-- 博多ポートタワー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '博多ポートタワー', '博多ふ頭に立つ、高さ100mの赤い鉄塔。1964年に開業し、東京タワーと同じ内藤多仲が設計した。地上70mの円い展望室には無料で上がることができ、人の少ない時間には、港の明かりに囲まれた昭和の部屋だけが静かに浮かんでいる。', '天神から徒歩約15分。西鉄バス90番（天神方面から）・99番（博多駅から）で終点「博多ふ頭」下車。10:00〜20:00、水曜休館、入場無料（福岡市の観光サイト）。', 33.6043, 130.39776, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '博多ポートタワー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福岡', '昭和レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/SleepdeeplyGG/status/1988222440850550824', 'https://pbs.twimg.com/media/G5eVwfvbMAAXxXN.jpg', 0),
  ('https://x.com/BABAOSUKE/status/1314954067102199808', 'https://pbs.twimg.com/media/Ej-nwGQUcAAjG9d.jpg', 1)
) as v(url, thumb, pos);

-- 福岡タワー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '福岡タワー', '百道浜の埋立地に立つ、高さ234mの海辺のタワー。1989年のアジア太平洋博覧会（よかトピア）のモニュメントとして建てられ、外側は約8000枚のハーフミラーで覆われている。地上123mの展望室は、夜になると窓に室内が映り込み、海と街と自分の姿の境目があいまいになる。', '天神から西鉄バスW1・302番で約15分、博多駅から306番で約25分（公式サイト）。展望室は9:30〜22:00、大人1,000円。', 33.59308, 130.35139, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '福岡タワー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福岡', '平成レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/taroigarashi/status/2094837184696332459', 'https://pbs.twimg.com/media/HRJZ4rZbAAAuiAz.jpg', 0),
  ('https://x.com/towerup_tw/status/1378602103258578946', 'https://pbs.twimg.com/media/EyHHTAZUUAQXw3A.jpg', 1)
) as v(url, thumb, pos);

-- 若戸渡船
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '若戸渡船', '北九州・洞海湾をはさんだ若松と戸畑を、片道約3分で結ぶ小さな渡し船。明治のころから続き、1962年に真上に若戸大橋が架かったあとも、市民の要望で運航が続けられてきた。巨大な赤い橋の下を小さな船が行き来する景色と古い渡場には、時代の流れから少しだけ外れたような空気がある。', '若松渡場（JR若松駅方面）と戸畑渡場（JR戸畑駅方面）のあいだを運航。大人100円、おおむね5時台から22時台まで（北九州市の時刻表）。天候で運休することがある。市民の生活の足なので、乗る人を写さないように。', 33.90216, 130.81462, null
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '若戸渡船')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福岡', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/Wakatotosen/status/1628724624627499008', 'https://pbs.twimg.com/media/FppkaIVacAAXzhi.jpg', 0),
  ('https://x.com/Wakatotosen/status/1589446791795445761', 'https://pbs.twimg.com/media/Fg7ZZcsakActTba.jpg', 1)
) as v(url, thumb, pos);

-- グラバースカイロード（斜行エレベーター）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'グラバースカイロード（斜行エレベーター）', '長崎・南山手の斜面を、斜めに上っていくエレベーター。2002年に市道の一部として造られ、誰でも無料で乗ることができる。丸い窓のついた箱が、港と斜面の家並みを見下ろしながら静かに上っていく。道路とも乗り物ともつかない、坂の街ならではの不思議な通路。', '長崎電気軌道「石橋」電停から徒歩約1分。6:00〜23:30、無料（ながさき旅ネット）。斜面に暮らす人たちの生活の足で、周りは住宅地。家や住民を写さないように。', 32.73301, 129.87155, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'グラバースカイロード（斜行エレベーター）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '長崎', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/yuzuta_sanpo/status/2091654246227681614', 'https://pbs.twimg.com/media/HQcMc4vWkAAz1V9.jpg', 0),
  ('https://x.com/peter_tabitetsu/status/1949271578228691156', 'https://pbs.twimg.com/media/Gw00HNjboAAejW-.jpg', 1)
) as v(url, thumb, pos);

-- 既存の公式スポットの文章の修正（今の文章が確認時と同じとき＝md5 が一致するときだけ書き換える）

-- ffbCQ6bM 旧志免鉱業所竪坑櫓（誤字「ものでで」）
update public.spots set description = '旧海軍が炭鉱の坑口として建設した鉄筋コンクリート造の竪坑櫓。戦前に建てられた塔櫓巻き（ワインディングタワー）形式の竪坑櫓として国内で唯一、世界でも3基しか残っていない貴重なもので、無骨なコンクリート塊が住宅街の中に唐突にそびえる異様な存在感を放つ。周囲は緑豊かな公園として整備され、日常の風景の中に軍事・産業遺産としての巨大な廃墟がぽつんと取り残されている対比が、独特の非現実感を漂わせる。', updated_at = now()
where slug = 'ffbCQ6bM' and md5(description) = '549134aca339e1817beaf54cec4ec425';

-- uN8qRiyB 別府温泉保養ランド（泥湯）（不自然な言い回し）
update public.spots set description = '明礬温泉郷の山中に位置する古くは風土記にも記されたという紺屋地獄の泥を引く泥湯温泉。青白色の泥がボコボコと泡を立てて湧く光景は、この世のものとは思えない不思議な光景です。山の中に湯けむりが立ちこめ、日常のすぐ隣にある別世界に足を踏み入れたような感覚に陥ります。自然の地熱エネルギーが生み出す本物の泥湯は、現実離れしたリミナル空間としてSNSでも話題を呼んでいます。', updated_at = now()
where slug = 'uN8qRiyB' and md5(description) = '8796c6f2face2335178188b5464e2857';

commit;

-- 確認用：追加した6件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('関門トンネル人道', '天神地下街', '博多ポートタワー', '福岡タワー', '若戸渡船', 'グラバースカイロード（斜行エレベーター）')
order by s.created_at;
