-- 東北の公式スポット7件を追加し、既存の東北スポット2件の文章を直す（記事「東北のリミナルスペース」用。2026-09-28）
--
-- 追加する7件は、どれも今も誰でも行ける場所（記念館の連絡船・美術館・公共施設・旧銀行・展望タワー・旧県庁舎・お堂）。
-- 事実（開業年・設計者など）と営業・公開中であることは、公式サイト・自治体・Wikipedia などで確認済み。説明文は LIMap 独自の文章。
-- 写真の代わりに、同じ場所を写した写真付きの X 投稿を埋め込みとして付ける（公開中であることを確認済み）。
--
-- 同じタイトルの公式スポットが既にあれば追加しないので、誤って2回流しても二重には登録されない。
-- ID（slug）は自動で割り振られる。

begin;

-- 使うタグ（まだ無いものだけ作られる）
insert into public.tags (name) values ('リミナルスペース'), ('青森'), ('昭和レトロ'), ('公共施設'), ('宮城'), ('岩手'), ('レトロ建築'), ('秋田'), ('平成レトロ'), ('山形'), ('福島') on conflict (name) do nothing;

-- 青函連絡船メモリアルシップ八甲田丸
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '青函連絡船メモリアルシップ八甲田丸', '1964年に就航し、1988年3月まで青森と函館を結んだ青函連絡船。今は青森駅のすぐそばの岸壁に係留され、メモリアルシップとして公開されている。列車ごと船に積み込んでいた車両甲板には、役目を終えた客車や貨車がそのまま並び、昭和の青森駅前を人形で再現した展示もある。出航しない船の中を歩くと、止まった時間の中に迷い込んだような気分になる。', 'JR青森駅から徒歩5分。4〜10月は9:00〜19:00で無休、11〜3月は9:00〜17:00で月曜休館。大人510円（青森市）。', 40.83161, 140.73639, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '青函連絡船メモリアルシップ八甲田丸')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '青森', '昭和レトロ')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/hakkouda1/status/1516570114568900610', 'https://pbs.twimg.com/media/FQvt-nBaUAEWkJj.jpg', 0),
  ('https://x.com/terrysongs1203/status/2100757521220911252', 'https://pbs.twimg.com/media/HSdj1MMbIAElnh7.jpg', 1)
) as v(url, thumb, pos);

-- 青森県立美術館
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '青森県立美術館', '三内丸山遺跡のとなりに建つ、2006年開館の美術館。設計は青木淳で、発掘現場のような土の溝（トレンチ）に、白い箱をかぶせたような建物になっている。白い壁の通路や階段が入り組み、歩いているうちに自分がどこにいるのか分からなくなる。雪の日や夜には、白い建物そのものが現実から浮いて見える。', '青森駅から市営バスで約20分、新青森駅からシャトルバスで約10分、「県立美術館前」下車。9:30〜17:00、コレクション展は一般700円（公式サイト）。展示替えで休館する日がある。', 40.80739, 140.70072, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '青森県立美術館')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '青森', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/BotKenchiku/status/1862566740204339644', 'https://pbs.twimg.com/media/EoeRtZPVEAEwqp1.jpg', 0),
  ('https://x.com/orionis23/status/1984175606645576156', 'https://pbs.twimg.com/media/G4k1MGoa4AAGXGH.jpg', 1)
) as v(url, thumb, pos);

-- せんだいメディアテーク
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', 'せんだいメディアテーク', '仙台・定禅寺通りに建つ、2001年開館の公共施設。設計は伊東豊雄で、床を支えるのは、海草のようにゆらぐ13本の鉄骨のチューブだけ。ガラス越しに見える何層もの床は、夜になると光る水槽のように通りに浮かぶ。誰でも無料で夜まで入れ、人の少ないフロアには、使い道の決まっていない広い空間が静かに広がっている。', '地下鉄南北線「勾当台公園」駅「公園2出口」から徒歩7分。9:00〜22:00、入館無料。第4木曜（12月を除く）と年末年始は休館（公式サイト）。図書館などの利用者を写さないように。', 38.26547, 140.86556, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = 'せんだいメディアテーク')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '宮城', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/BotKenchiku/status/2068830089647931690', 'https://pbs.twimg.com/media/HLX1_wfb0AA_9Pd.jpg', 0),
  ('https://x.com/patternpat55981/status/2102560039278178473', 'https://pbs.twimg.com/media/HS3LMkMbkAABt4f.jpg', 1)
) as v(url, thumb, pos);

-- 岩手銀行赤レンガ館（旧盛岡銀行本店本館）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '岩手銀行赤レンガ館（旧盛岡銀行本店本館）', '1911年に盛岡銀行の本店として建てられた、辰野金吾・葛西萬司設計の赤レンガの建物。国の重要文化財で、2012年まで銀行として使われ、2016年から一般公開されている。高い天井の旧営業室には、客も行員もいないカウンターだけが残り、役目を終えた銀行の時間がそのまま止まっている。', '盛岡駅からバスで「盛岡バスセンター（ななっく前）」下車、徒歩1分。10:00〜17:00、火曜休館、一般300円（公式サイト）。専用駐車場なし。', 39.70061, 141.15517, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '岩手銀行赤レンガ館（旧盛岡銀行本店本館）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '岩手', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/AMFFCRAFTWORK/status/1703369209340993769', 'https://pbs.twimg.com/media/F6OVQCtbIAAFNd4.jpg', 0),
  ('https://x.com/kCDR0sMOoEiPNm5/status/2024099629642531271', 'https://pbs.twimg.com/media/HBcL4gfaUAAPMNM.jpg', 1)
) as v(url, thumb, pos);

-- 秋田市ポートタワー セリオン
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '秋田市ポートタワー セリオン', '秋田港の端に立つ、高さ143.6mのガラスのタワー。1994年に開業し、地上100mの展望室は2007年から無料で開放されている。夜や平日の展望室は人がまばらで、日本海と港の明かりだけが窓の外に広がる。平成のはじめの空気を残した、誰もいない高い部屋。', 'JR秋田駅西口からバスで「セリオン」下車、またはJR土崎駅から徒歩約25分。展望室は9:00〜21:00、無料（公式サイト）。道の駅を兼ねた施設なので、ほかの客を写さないように。', 39.75272, 140.061, 'night'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '秋田市ポートタワー セリオン')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '秋田', '平成レトロ', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/rpsdymizuniwa/status/1778025199293899090', 'https://pbs.twimg.com/media/GKzQfe9bsAAqUCn.jpg', 0),
  ('https://x.com/selion_akitakou/status/1819550185539952892', 'https://pbs.twimg.com/media/GUBWdVmb0AI7M6e.jpg', 1)
) as v(url, thumb, pos);

-- 山形県郷土館 文翔館（旧県庁舎・県会議事堂）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '山形県郷土館 文翔館（旧県庁舎・県会議事堂）', '1916年に建てられた山形県の旧県庁舎と県会議事堂。田原新之助の設計によるレンガ造りの建物で、国の重要文化財。1986年から約10年かけて当時の姿に修復され、今は無料で公開されている。長い廊下の先に、誰も座っていない旧知事室や会議室が続き、役所としての役目だけが抜け落ちたような静けさがある。', 'バス「市役所前」から徒歩1分、JR山形駅から徒歩約24分。9:00〜16:30、入館無料。第1・第3月曜（祝日の場合は翌日）と年末年始は休館（公式サイト）。', 38.25689, 140.34122, 'daytime'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '山形県郷土館 文翔館（旧県庁舎・県会議事堂）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '山形', 'レトロ建築', '公共施設')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/orz_ted/status/1787047272594932168', 'https://pbs.twimg.com/media/GMzd9y5bAAAd2Q3.jpg', 0),
  ('https://x.com/Myoga0615/status/1332577244749864960', 'https://pbs.twimg.com/media/En5D6wuUYAAyoEd.jpg', 1)
) as v(url, thumb, pos);

-- 会津さざえ堂（円通三匝堂）
with s as (
  insert into public.spots (author_id, title, description, access, lat, lng, recommended_visit_time)
  select '09063d11-7b7d-4e5f-8c65-7b72f4b52134', '会津さざえ堂（円通三匝堂）', '1796年に建てられた、高さ16.5mの六角三層の木造のお堂。中は上りと下りが別になった二重らせんのスロープで、一方通行のため、ほかの参拝者とすれ違うことがない。ぐるぐると上って下りるうちに、いつの間にか入口とは別の場所から外に出ている。200年以上前に造られた、不思議な順路の建物。', '会津若松駅からまちなか周遊バスで「飯盛山下」下車、徒歩約5分。4〜11月は8:15〜日没、12〜3月は9:00〜16:00、大人400円（会津若松観光ビューロー）。中のスロープは狭いので、ほかの参拝者の通行に気をつけて。', 37.50453, 139.95397, 'morning'
  where not exists (select 1 from public.spots where author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and title = '会津さざえ堂（円通三匝堂）')
  returning id
), t as (
  insert into public.spot_tags (spot_id, tag_id)
  select s.id, tags.id from s join public.tags on tags.name in ('リミナルスペース', '福島', 'レトロ建築')
)
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, v.pos from s, (values
  ('https://x.com/kobateck/status/1922626178424230176', 'https://pbs.twimg.com/media/Gq6KS7xaEAAQ-ZV.jpg', 0),
  ('https://x.com/linda_tonaki/status/2084631372317274477', 'https://pbs.twimg.com/media/HO4ZJq0a4AAC0KH.jpg', 1)
) as v(url, thumb, pos);

-- 既存の公式スポットの文章の修正（今の文章が確認時と同じとき＝md5 が一致するときだけ書き換える）

-- uAvsFVzp ロピア弘前店（文字化け「閃め顏」）
update public.spots set description = '弘前駅前の商業施設「CiiNA弘前」地下1階に入居するスーパー「ロピア」。無機質に並ぶ蛍光灯とタイル張りの床、地下特有の閉ざされた空気が、どこにでもありそうでどこにもないスーパーの雰囲気を作り出している。日常の買い物空間にひそむ「実在するリミナルスペース」としてSNSで話題になった。', updated_at = now()
where slug = 'uAvsFVzp' and md5(description) = '5d869666e37e76024fe20d614b6511f6';

-- HLy7yJkZ スパリゾートハワイアンズ スプリングパーク（誤字「静寥」）
update public.spots set description = '福島県いわき市の大型リゾート・スパリゾートハワイアンズにある屋内プール施設「スプリングパーク」。ローマ風の柱が並ぶ温水プールは、混雑時はなごやかだが、人のいない時間帯には一転して静まり返った異空間に。運営側の公式Xアカウント自らが「ドリームコア」「リミナルスペース」と認めるほど、現実離れした美しさがSNSで話題。', updated_at = now()
where slug = 'HLy7yJkZ' and md5(description) = '735b93d2811993d5bfb363b99b483006';

commit;

-- 確認用：追加した7件（タグの数・埋め込みの数つき）
select s.slug, s.title,
       (select count(*) from public.spot_tags t where t.spot_id = s.id) as tags,
       (select count(*) from public.spot_embeds e where e.spot_id = s.id) as embeds
from public.spots s
where s.author_id = '09063d11-7b7d-4e5f-8c65-7b72f4b52134' and s.title in ('青函連絡船メモリアルシップ八甲田丸', '青森県立美術館', 'せんだいメディアテーク', '岩手銀行赤レンガ館（旧盛岡銀行本店本館）', '秋田市ポートタワー セリオン', '山形県郷土館 文翔館（旧県庁舎・県会議事堂）', '会津さざえ堂（円通三匝堂）')
order by s.created_at;
