-- 秘境駅・地下深くの駅の公式スポット6件を追加する（記事「駅のリミナルスペース」用。2026-10-03）
--
-- 土合駅（群馬）・筒石駅（新潟）・小幌駅（北海道）・坪尻駅（徳島）・田本駅（長野）・小和田駅（静岡）。どれも今も列車が止まる現役の駅。
-- 開業年・段数・停車本数・運行状況（2026年の災害による運休と再開を含む）は、鉄道会社・自治体・報道などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、駅を写した写真付きの X 投稿を埋め込みとして付ける（公開中で、写真に駅が写っていることを確認済み）。
-- 大井川鐵道井川線の尾盛駅・奥大井湖上駅は、2026年7月から全列車が予約制になり行き方が変わったため、今回は見送った。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。ID（slug）は自動で割り振られる。

begin;

-- 使うタグ（まだ無いものだけ作られる）
insert into public.tags (name) values ('リミナルスペース'), ('駅'), ('無人駅'), ('地下'), ('トンネル'), ('群馬'), ('新潟'), ('秘境駅'), ('北海道'), ('徳島'), ('長野'), ('静岡') on conflict (name) do nothing;

-- 土合駅（下り地下ホームと462段の階段）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '土合駅（下り地下ホームと462段の階段）', 'JR上越線の無人駅。上りホームは地上にあるが、下りホームは1967年に開通した新清水トンネルの中にあり、駅舎から70mほど下にある。改札から連絡通路の24段と、まっすぐ続く462段の階段を下りて、ようやくホームに着く。照明が等間隔に並ぶ階段は下りで10分ほど、上りはその倍以上かかることもある。止まる列車は1日数本なので、帰りの時刻を確かめてから下りたい。', 'JR上越線 土合駅（下りホームから改札まで計486段の階段。エレベーター・エスカレーターなし）', 36.831361, 138.967111, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '土合駅（下り地下ホームと462段の階段）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '地下', 'トンネル', '群馬')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/RailwayTown_Omy/status/2076600021097566285', 'https://pbs.twimg.com/media/HNEb9kubAAAjp-8.jpg', 0),
  ('https://x.com/akio0911/status/1761353838601339022', 'https://pbs.twimg.com/media/GHGV-s7agAAJka3.jpg', 1)
) as v(url, thumb, pos);

-- 筒石駅（頸城トンネル内のホーム）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '筒石駅（頸城トンネル内のホーム）', 'えちごトキめき鉄道日本海ひすいラインの無人駅。北陸本線の複線化に合わせて1969年、全長約11kmの頸城トンネルの中に移された。ホームは地上の駅舎から40mほど下にあり、改札から下りホームまでは290段、上りホームまでは280段の階段を歩く。列車が通るとトンネル内に強い風が吹き抜けるため、ホームと通路は重い引き戸で仕切られている。', 'えちごトキめき鉄道 日本海ひすいライン 筒石駅（改札からホームまで280〜290段の階段）', 37.127611, 138.060611, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '筒石駅（頸城トンネル内のホーム）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '地下', 'トンネル', '新潟')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/JIYUKENKYU_jp/status/2025188367663858148', 'https://pbs.twimg.com/media/HBrqBmga4AAwlLV.jpg', 0),
  ('https://x.com/potato_stick455/status/2033424448104358234', 'https://pbs.twimg.com/media/HDgswcdbsAE4f6m.jpg', 1)
) as v(url, thumb, pos);

-- 小幌駅（トンネルに挟まれた秘境駅）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '小幌駅（トンネルに挟まれた秘境駅）', 'JR室蘭本線の無人駅。二つの長いトンネルに挟まれた80mほどのすき間にあり、三方を急な崖、残る一方を内浦湾に囲まれている。1943年に列車の行き違いのための信号場として設けられ、1987年に駅になった。駅に通じる道路はなく、止まる普通列車は1日6本だけ。2015年に廃止が検討されたが、翌年から豊浦町が管理して残している。周辺はヒグマが出るので、単独での訪問は避けたい。', 'JR室蘭本線 小幌駅（道路なし。列車でのみ到達可。停車する普通列車は1日6本）', 42.589700, 140.537319, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '小幌駅（トンネルに挟まれた秘境駅）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '秘境駅', 'トンネル', '北海道')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/otatravel/status/1857881669870694851', 'https://pbs.twimg.com/media/GciFiBRbkAAugEZ.jpg', 0),
  ('https://x.com/yuma55subway/status/2088510250236424669', 'https://pbs.twimg.com/media/HPvgyfNaAAAYAok.jpg', 1)
) as v(url, thumb, pos);

-- 坪尻駅（谷底のスイッチバック駅）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '坪尻駅（谷底のスイッチバック駅）', 'JR土讃線の無人駅。徳島と香川の県境に近い阿讃山地の谷底にあり、駅まで通じる車道はない。1929年に信号場として開設され、1950年に駅になった。勾配が急なためスイッチバック式で、止まる列車は引き込み線でいったん向きを変えてからホームに出入りする。古い木造の駅舎が残り、止まる普通列車は上下各3本だけ。山道は滑りやすく、崖沿いで柵のない所もある。', 'JR土讃線 坪尻駅（車道なし。県道5号から山道を徒歩10〜20分。停車する普通列車は上下各3本）', 34.054036, 133.823681, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '坪尻駅（谷底のスイッチバック駅）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '秘境駅', '徳島')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/always_rain3/status/2093293380264735102', 'https://pbs.twimg.com/media/HQzfOjhbMAAzKh6.jpg', 0),
  ('https://x.com/hatolier_camera/status/1414433593783316481', 'https://pbs.twimg.com/media/E6ETxNaUUAIKvie.jpg', 1)
) as v(url, thumb, pos);

-- 田本駅（天竜川の断崖の駅）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '田本駅（天竜川の断崖の駅）', 'JR飯田線の無人駅。天竜川の峡谷の断崖の途中にあり、ホームの背後には巨大なコンクリートの擁壁がそびえ、線路の下は谷になっている。駅舎はなく、ホームに小さな待合所があるだけ。車では行けず、トンネルの脇から細い山道を20分ほど登ると集落に出る。1935年に三信鉄道の停留場として開業した。普通列車でも通過するものがあるので、時刻表を確かめてから降りたい。', 'JR飯田線 田本駅（車道なし。集落まで山道を徒歩約20分）', 35.349006, 137.837942, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '田本駅（天竜川の断崖の駅）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '秘境駅', '長野')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/miyadutakuya/status/1557955023409057793', 'https://pbs.twimg.com/media/FZ73wKOUEAIEfUN.jpg', 0),
  ('https://x.com/warau_urawa2026/status/1814589529690710113', 'https://pbs.twimg.com/media/GS63jLHbIAALBTH.jpg', 1)
) as v(url, thumb, pos);

-- 小和田駅（三県境の秘境駅）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '小和田駅（三県境の秘境駅）', 'JR飯田線の無人駅で、静岡・愛知・長野の三県の境に近い天竜川沿いにある。1936年に三信鉄道の駅として開業したが、1956年に完成した佐久間ダムで川沿いの集落の一部が湖に沈み、のちに周りから人の暮らしが消えた。駅に通じる車道はなく、いちばん近い集落まで山道を1時間ほど歩く。木造の駅舎と、住居や製茶工場の跡が残っている。', 'JR飯田線 小和田駅（車道なし。最寄りの集落まで山道を徒歩約1時間）', 35.209883, 137.836103, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '小和田駅（三県境の秘境駅）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '駅', '無人駅', '秘境駅', '静岡')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/always_rain3/status/1976472978989973667', 'https://pbs.twimg.com/media/G23XryPaAAA7pl4.jpg', 0),
  ('https://x.com/usiuna7991/status/1335032878883749888', 'https://pbs.twimg.com/media/Eob9NmbUwAEa8Hs.jpg', 1)
) as v(url, thumb, pos);

commit;
