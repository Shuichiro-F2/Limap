-- 名古屋市内の公式スポット8件を追加する（記事「名古屋のリミナルスペース」用。2026-09-27）
--
-- どれも今も誰でも行ける場所（地下街・公共建築・公園・商店街など）。事実（開業年・文化財指定など）と
-- 営業・公開中であることは、公式サイト・名古屋市・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 伏見地下街（長者町地下街）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '伏見地下街（長者町地下街）', '地下鉄伏見駅から東へ、一直線に240mのびる細長い地下街。1957年、地上の長者町繊維街と駅を結ぶ地下の問屋街として生まれた。店が通路の片側にしか並ばず、黄緑と橙に塗られた壁とむき出しの配管が、開業当時の空気をそのまま閉じ込めている。店が開く前や閉まったあとの通路は、どこまでも同じ景色が続く長い廊下になる。', '地下鉄東山線「伏見」駅の東改札から直結。地上からは錦通沿いの出入口から入れる。通れる時間が決まっていて、日曜・祝日は通れないことが多いので、事前に確認を。', 35.16954, 136.89933, null
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '伏見地下街（長者町地下街）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', '地下街', '地下', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/akira_x1020/status/1853241020328415715', 'https://pbs.twimg.com/media/GbgI4jMbEAEE1bD.jpg', 0),
  ('https://x.com/araichuu/status/2032688002108109020', 'https://pbs.twimg.com/media/HDWO9U2aMAUOwW-.jpg', 1)
) as v(url, thumb, pos);

-- 名駅地下街サンロード
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '名駅地下街サンロード', '1957年に開業した、名古屋でいちばん古い地下街。地下鉄東山線と一緒に造られたため、開業当時の通路は線路に沿って大きくカーブしている。先の見えない曲がった通路に同じような店先が続き、開店前の人のいない時間には、どこまで歩いても同じ場所に戻ってくるような感覚になる。', '地下鉄東山線「名古屋」駅の南改札を出てすぐ。名鉄・近鉄の名古屋駅からも直結。営業時間は10:00〜20:30（公式サイト）。', 35.16943, 136.88495, null
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '名駅地下街サンロード')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', '地下街', '地下')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/fromnagoya_tw/status/1636887389393293316', 'https://pbs.twimg.com/media/FrbY1gYaEAAh7nq.jpg', 0)
) as v(url, thumb, pos);

-- オアシス21
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'オアシス21', '栄の真ん中にある、公園とバスターミナルと商業施設が一体になった立体公園。2002年に開業した。ガラスの大屋根「水の宇宙船」の上には薄く水が張られ、その下の吹き抜けの広場に光の模様が揺れる。朝早くや夜遅く、人のいない屋上や広場に立つと、昔思い描かれた未来の風景の中に取り残されたような気分になる。', '地下鉄東山線・名城線「栄」駅の東改札を出てすぐ、名鉄瀬戸線「栄町」駅から直結。「水の宇宙船」は10:00〜21:00、下の広場は6:00〜23:00（名古屋市の観光案内による）。', 35.17083, 136.90944, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'オアシス21')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/oinagoya/status/2053788351124451532', 'https://pbs.twimg.com/media/HICFnRZbEAAOvHt.jpg', 0),
  ('https://x.com/uzumaki1026/status/1864679917428072795', 'https://pbs.twimg.com/media/GeCsgHQa0AkiqYQ.jpg', 1)
) as v(url, thumb, pos);

-- 名古屋市市政資料館（旧名古屋控訴院）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '名古屋市市政資料館（旧名古屋控訴院）', '1922年に裁判所として建てられた、赤レンガの国の重要文化財。1979年まで裁判所として使われ、今は名古屋市の資料館として無料で公開されている。大理石とステンドグラスの中央階段、再現された法廷、同じ扉が並ぶ長い廊下。人の少ない平日には、役目を終えた建物の静けさだけが館内を満たしている。', '地下鉄名城線「名古屋城」駅2番出口から東へ徒歩8分、名鉄瀬戸線「東大手」駅から南へ徒歩5分。9:00〜17:00、入館無料。月曜・第3木曜は休館（名古屋市）。', 35.18121, 136.91026, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '名古屋市市政資料館（旧名古屋控訴院）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', 'レトロ建築', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/FriendTK/status/1629400285054668800', 'https://pbs.twimg.com/media/FpzKNUMakAEZGb0.jpg', 0),
  ('https://x.com/fromnagoya_life/status/2029889742817611944', 'https://pbs.twimg.com/media/HCsQAZ1akAAJlQE.jpg', 1)
) as v(url, thumb, pos);

-- 名古屋市役所本庁舎
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '名古屋市役所本庁舎', '1933年に完成した、今も使われている市庁舎。屋根に瓦とシャチを載せた時計塔が目印で、隣の愛知県庁本庁舎とともに国の重要文化財に指定されている。北側の廊下は全長約100m。同じ窓と扉がどこまでも並ぶ景色は、映画やドラマの撮影にも使われている。', '地下鉄名城線「名古屋城」駅から地下通路で連絡、徒歩1分。見学は平日の開庁時間（8:45〜17:15）に、廊下や階段などの共用部分のみ。職員や来庁者が写らないように撮影を（名古屋市の見学案内）。', 35.18145, 136.90637, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '名古屋市役所本庁舎')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', 'レトロ建築', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/YanaWaveInst/status/1784808018410143807', 'https://pbs.twimg.com/media/GMTpatsaIAA66tm.jpg', 0),
  ('https://x.com/last_landscape/status/1995827909635047466', 'https://pbs.twimg.com/media/G7KY8BWbgAEbI2P.jpg', 1)
) as v(url, thumb, pos);

-- 東山スカイタワー
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '東山スカイタワー', '東山公園の丘の上に立つ、高さ134mの展望塔。名古屋市制100周年を記念して1989年に開業した。森の中の遊歩道を歩いてたどり着く立地と、平成のはじめの空気を残す展望室があいまって、平日や夜の展望室には、街の明かりを見下ろす人影がまばらにあるだけの静かな時間が流れる。', '地下鉄東山線「星ヶ丘」駅6番出口、または「東山公園」駅3番出口から徒歩約15分（公式サイト）。9:00〜21:30、月曜休館、大人300円。駅からの道は森の遊歩道を通るので、夕方以降は注意。', 35.15669, 136.97881, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '東山スカイタワー')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', '平成レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/oinagoya/status/2080241512399397199', 'https://pbs.twimg.com/media/HN1x4gjbMAAVCkj.jpg', 0)
) as v(url, thumb, pos);

-- 鶴舞公園 噴水塔
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '鶴舞公園 噴水塔', '1909年に開かれた、名古屋市で最初の公園・鶴舞公園の中心に立つ噴水塔。翌1910年、この公園を会場にした第10回関西府県連合共進会にあわせて造られた。地下鉄工事のため1973年にいったん解体されたが、1977年に元の姿で復元され、今は名古屋市の文化財になっている。円く並んだ大理石の列柱と洋風の広場は、朝早くの誰もいない時間、終わった博覧会の会場だけが残されたような景色を見せる。', 'JR中央線「鶴舞」駅からすぐ、地下鉄鶴舞線「鶴舞」駅4番出口から。公園は24時間・無料で入れる（公式サイト）。', 35.15556, 136.91895, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '鶴舞公園 噴水塔')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/muurin/status/1662285928436752384', 'https://pbs.twimg.com/media/FxGgPK8aMAAkUvN.jpg', 0),
  ('https://x.com/santa_dx/status/1920129410142814289', 'https://pbs.twimg.com/media/GqWrcz7aYAAczBA.jpg', 1)
) as v(url, thumb, pos);

-- 円頓寺商店街
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '円頓寺商店街', '名古屋駅の東、那古野に続く約220mのアーケード商店街。江戸時代から続く商店街で、アーケードは1964年に架けられ、2015年に改修された。日中は人でにぎわうが、店が開く前の早朝や定休日には、長いアーケードの下にシャッターと看板だけが並ぶ、静かな通り抜けの空間になる。', '地下鉄桜通線「国際センター」駅2番出口から北へ徒歩8分、地下鉄「丸の内」駅8番出口から西へ徒歩8分、名古屋駅から東へ徒歩15分（公式サイト）。', 35.17626, 136.89126, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '円頓寺商店街')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '愛知', '商店街', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/tomi3papa2/status/1502976695527116801', 'https://pbs.twimg.com/media/FNulVORVgAMGKwL.jpg', 0)
) as v(url, thumb, pos);

commit;

-- 確認用：追加した8件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('伏見地下街（長者町地下街）', '名駅地下街サンロード', 'オアシス21', '名古屋市市政資料館（旧名古屋控訴院）', '名古屋市役所本庁舎', '東山スカイタワー', '鶴舞公園 噴水塔', '円頓寺商店街')
order by s.created_at;
