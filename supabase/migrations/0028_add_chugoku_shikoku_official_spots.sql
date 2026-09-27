-- 中国・四国の公式スポット7件を追加し、既存スポット1件（鹿忍グリーンファーム跡）の空だった説明文を入れる（記事「中国・四国のリミナルスペース」用。2026-09-28）
--
-- 追加する7件は、どれも今も誰でも行ける場所（アーケード・県庁舎・ロープウェイ・旧駅・ごみ処理工場の見学通路・終着駅・地下街）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
-- 香川・徳島・島根の都道府県タグはまだ無かったので、ここで作る。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 使うタグ（まだ無いものだけ作られる）
insert into public.tags (name) values ('リミナルスペース'), ('香川'), ('商店街'), ('レトロ建築'), ('公共施設'), ('徳島'), ('昭和レトロ'), ('島根'), ('廃駅'), ('広島'), ('鳥取'), ('駅'), ('地下街'), ('地下') on conflict (name) do nothing;

-- 高松丸亀町壱番街前ドーム広場（高松中央商店街）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '高松丸亀町壱番街前ドーム広場（高松中央商店街）', '8つの商店街がつながり、総延長約2.7kmにわたってアーケードが続く高松中央商店街。その中心、丸亀町の北の端に、高さ32.2mのガラスのドームがかかる広場がある。店のシャッターが下りた早朝や夜、明るい屋根の下に人のいない通りがどこまでも延び、大きなドームの下の広場がかえって空っぽさを際立たせる。', 'JR高松駅から徒歩約10分（高松市の観光サイト）。公道のアーケードで誰でも通れる。店先や通る人を写さないように。', 34.34601, 134.05054, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '高松丸亀町壱番街前ドーム広場（高松中央商店街）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '香川', '商店街')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/ng_zk_08_10/status/2077213310404153650', 'https://pbs.twimg.com/media/HNO-fVwbYAApVSn.jpg', 0),
  ('https://x.com/UdonkenKanko/status/1409307456463769600', 'https://pbs.twimg.com/media/E47da2lVgAQQkbd.jpg', 1)
) as v(url, thumb, pos);

-- 香川県庁舎東館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '香川県庁舎東館', '1958年に完成した、丹下健三設計の県庁舎。2022年に、戦後の庁舎建築として初めて国の重要文化財に指定された。打ち放しコンクリートの柱が並ぶピロティと1階のロビーには、猪熊弦一郎の壁画が残り、今も県庁として使われている。人の少ない時間のロビーには、戦後に思い描かれた「開かれた役所」の空気が静かに漂う。', 'ことでん「瓦町」駅から徒歩約10分、JR高松駅から徒歩約20分。ピロティや1階ロビーなどの共用部分は、平日の開庁時間（8:30〜17:15）に自由に見学できる（香川県）。職員や来庁者を写さないように。', 34.34015, 134.04344, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '香川県庁舎東館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '香川', 'レトロ建築', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/Design_walker/status/2047994277901242662', 'https://pbs.twimg.com/media/HGvoa92bcAEn29f.jpg', 0),
  ('https://x.com/HUovERZtAQhq4tS/status/1617381170257485824', 'https://pbs.twimg.com/media/FnIXl4VaUAALy4b.jpg', 1)
) as v(url, thumb, pos);

-- 眉山ロープウェイ（阿波おどり会館 山麓駅）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '眉山ロープウェイ（阿波おどり会館 山麓駅）', '徳島市の眉山山頂へ向かう、1957年開業のロープウェイ。山麓駅は阿波おどり会館の建物の中にあり、ビルの上の階から乗り込むと、約6分で標高290mの山頂に着く。ビルの中の駅と、人の少ない夕方や夜の山頂駅は、どこへ向かう途中なのか分からなくなるような場所になる。', 'JR徳島駅から徒歩約10分。4〜10月は9:00〜21:00、11〜3月は9:00〜17:30。大人往復1,500円（徳島県の観光サイト）。年に一度、検査のため運休する期間がある。', 34.07019, 134.54508, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '眉山ロープウェイ（阿波おどり会館 山麓駅）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '徳島', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/limbusarry/status/2053617830684455235', 'https://pbs.twimg.com/media/HH_qhazbgAAjXPd.jpg', 0),
  ('https://x.com/kingsuguru96/status/1916424248626958568', 'https://pbs.twimg.com/media/GpiBq7SbUAA5BJh.jpg', 1)
) as v(url, thumb, pos);

-- 旧大社駅
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '旧大社駅', '1990年に廃止された旧国鉄大社線の終着駅。1924年に建てられた、出雲大社を思わせる和風の木造駅舎は国の重要文化財で、ホームや蒸気機関車D51もそのまま残されている。保存修理を終えて2026年4月に公開が再開された。列車が二度と来ないホームに立つと、時刻表の途中で時間が止まったように感じる。', 'JR出雲市駅からバスで「旧JR大社駅」下車、徒歩1分。一畑電車「出雲大社前」駅から徒歩約13分。9:00〜16:30、水曜休館、一般300円（公式サイト）。', 35.38671, 132.69022, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '旧大社駅')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '島根', 'レトロ建築', '廃駅')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/sin103neko/status/2008797817322827909', 'https://pbs.twimg.com/media/G-CuzRLbEAA6mR-.jpg', 0),
  ('https://x.com/izumoguide/status/2043897090598940783', 'https://pbs.twimg.com/media/HF1hiEAasAALCv3.jpg', 1)
) as v(url, thumb, pos);

-- 広島市環境局中工場（エコリアム）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '広島市環境局中工場（エコリアム）', '2004年に完成した、谷口吉生設計のごみ処理工場。平和記念公園から海へ向かう軸線が建物の中を突き抜けるように設計され、誰でも入れるガラス張りの見学空間「エコリアム」を通って、動いている設備を見下ろしながら海の見える側へ歩いて抜けられる。美術館とも工場ともつかない、ぽっかりと空いた通路。', '広島バス「南吉島」から徒歩約5分。建物の外とエコリアムは、予約なしで9:00〜16:30に見学できる（年末年始は休み。広島市）。工場の中の見学は予約が必要。', 34.35849, 132.44226, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '広島市環境局中工場（エコリアム）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '広島', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/chechegi/status/1367518962070683649', 'https://pbs.twimg.com/media/EvpnPv3U8AIdFfM.jpg', 0),
  ('https://x.com/HUovERZtAQhq4tS/status/2084161208480133275', 'https://pbs.twimg.com/media/HOxtiopbQAE6xp8.jpg', 1)
) as v(url, thumb, pos);

-- 若桜駅（若桜鉄道）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '若桜駅（若桜鉄道）', '1930年に開業した、若桜鉄道の終着駅。中国地方でいちばん東にある駅で、木造の駅舎は登録有形文化財。線路の奥には手回しの転車台や給水塔、給炭台、蒸気機関車C12が残り、蒸気機関車の時代の設備が、使われないまま並んでいる。', '若桜鉄道の終点（JR因美線「郡家」駅で乗り換え）。構内の奥を見学するときは、駅の窓口で入構券（大人300円）を買う（若桜鉄道）。現役の駅なので、係員の指示に従うこと。', 35.34522, 134.39827, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '若桜駅（若桜鉄道）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '鳥取', '駅', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/8001stella/status/2054787744766001549', 'https://pbs.twimg.com/media/HIQShkJaEAAN7Y-.jpg', 0),
  ('https://x.com/onputorikun/status/2046769598067011957', 'https://pbs.twimg.com/media/HGeWGTMasAANRnz.jpg', 1)
) as v(url, thumb, pos);

-- 紙屋町シャレオ（地下街）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '紙屋町シャレオ（地下街）', '広島の中心、紙屋町交差点の地下を十字に走る地下街。2001年に開業した。店が開く前や閉まったあとには、明るい照明だけが残る長い通路と広場が、行き先の分からない地下の空間になる。', 'アストラムライン「県庁前」駅・「本通」駅と直結。店の営業は原則10:00〜20:00（公式サイト）。私有の商業施設なので、店や通る人を写さないように。', 34.39609, 132.45511, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '紙屋町シャレオ（地下街）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '広島', '地下街', '地下')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/nununu_nune/status/1501850988990238729', 'https://pbs.twimg.com/media/FNelfmTVEAAjhfm.jpg', 0)
) as v(url, thumb, pos);

-- 既存の公式スポットの文章の修正（今の文章が確認時と同じとき＝md5 が一致するときだけ書き換える）

-- tbdAv23o 鹿忍グリーンファーム跡（水没ペンション村）（説明文が空だったので追加）
update public.spots set description = '瀬戸内市牛窓町鹿忍の、かつての塩田の跡地に1980年ごろ造られたとされるレジャー施設の跡。三角屋根のペンションが並び、ゴルフやテニスを楽しめる施設だったといわれる。2000年ごろに閉業したあと、海面より低い土地から水をくみ出すことがなくなり、ペンションや車が水に浸かったまま残された。水面に三角屋根だけが並ぶ景色は、村ごと時間の中に沈んでしまったように見える。私有地のため、敷地には入らず外から眺めるだけにしたい。', updated_at = now()
where slug = 'tbdAv23o' and description is null;

commit;

-- 確認用：追加した7件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('高松丸亀町壱番街前ドーム広場（高松中央商店街）', '香川県庁舎東館', '眉山ロープウェイ（阿波おどり会館 山麓駅）', '旧大社駅', '広島市環境局中工場（エコリアム）', '若桜駅（若桜鉄道）', '紙屋町シャレオ（地下街）')
order by s.created_at;
