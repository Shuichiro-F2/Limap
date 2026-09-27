-- 写真のない公式スポット11件に、写真付きの X 投稿を埋め込みとして足す（2026-09-28）
--
-- 記事の中のカードやスポットの表紙が、写真ではなくピンのアイコンになっていたスポットが対象。
-- どの投稿も公開中で、写真にそのスポットが写っていることを確認済み。既存の埋め込みの後ろ（position 1 以降）に足す。
-- 同じ URL の埋め込みが既にあれば足さないので、2回流しても二重にはならない。
--
-- あわせて、「キリン乳業（株）関東工場」（日光市）のタイトルを、会社名を出さない形に変える。
-- タイトルの会社名と説明文（冷凍食品の工場）が合わず、実在の会社名が誤っている可能性があるため（Shu 了承済み）。

begin;

-- KM5aKcco
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/44Dutch/status/1619121880929292290', 'https://pbs.twimg.com/media/FnhGtv-agAApS03.jpg', 1)
) as v(url, thumb, ord)
where s.slug = 'KM5aKcco'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- o5t5vXLu
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/announeko/status/2102712442635853952', 'https://pbs.twimg.com/media/HS5VyiVaIAAjWZt.jpg', 1),
  ('https://x.com/jwa_FIVEROCKS/status/1339473918852100096', 'https://pbs.twimg.com/media/EpbECEWVgAMYxhm.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'o5t5vXLu'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- gf7SinSV
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/only_unko/status/1818928108810256629', 'https://pbs.twimg.com/media/GT4hZOVbwAUnBA7.jpg', 1)
) as v(url, thumb, ord)
where s.slug = 'gf7SinSV'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- ncUNG4h3
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/sayakaiurani/status/1643576035609542657', 'https://pbs.twimg.com/media/Fs8nr2xaUAA7myg.jpg', 1),
  ('https://x.com/m_yu_ya/status/1994573749275037935', 'https://pbs.twimg.com/media/G64mQCpbkAE_5an.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'ncUNG4h3'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- gE3dSWYN
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/rabbitmacky/status/1546090895325286403', 'https://pbs.twimg.com/media/FXTReSIVQAAh6qX.jpg', 1),
  ('https://x.com/a_hby_a/status/1389606305438912516', 'https://pbs.twimg.com/media/E0jfkQGUYAIqwXw.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'gE3dSWYN'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- sTsoVeXe
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/toricoro4169011/status/1755411080262873448', 'https://pbs.twimg.com/media/GFx5D9iaEAA89im.jpg', 1),
  ('https://x.com/_yuukiryuka/status/1439080965519806470', 'https://pbs.twimg.com/media/E_ikfTPVkAcvASo.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'sTsoVeXe'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- 7gRLUSMJ
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/tmymgazonet/status/1774302075268341951', 'https://pbs.twimg.com/media/GJ-WU26bcAA_iLk.jpg', 1),
  ('https://x.com/Canon_Williams_/status/1995700982660071915', 'https://pbs.twimg.com/media/G7IndCcbgAIuI2T.jpg', 2)
) as v(url, thumb, ord)
where s.slug = '7gRLUSMJ'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- ZMkEuArd
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/8010Teardrop/status/1491292707872190464', 'https://pbs.twimg.com/media/FLIizOhaIAE1K7s.jpg', 1),
  ('https://x.com/SleepdeeplyGG/status/2006351724102230383', 'https://pbs.twimg.com/media/G9f9r3dbcAAPgBe.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'ZMkEuArd'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- XBXoFcN3
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/hitoshi_anx/status/1771766128026472769', 'https://pbs.twimg.com/media/GJaT5b5bEAAsD9h.jpg', 1),
  ('https://x.com/port189/status/1866844824659517442', 'https://pbs.twimg.com/media/GehbRnVb0AAHdWL.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'XBXoFcN3'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- GL4Ht6wV
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/pomdepartments1/status/1562650157539553281', 'https://pbs.twimg.com/media/Fa-l999akAEh2UR.jpg', 1)
) as v(url, thumb, ord)
where s.slug = 'GL4Ht6wV'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- bRVna6ES
insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + v.ord
from public.spots s, (values
  ('https://x.com/deepannai/status/2035540648611455335', 'https://pbs.twimg.com/media/HD-xbbXaYAEa1UU.jpg', 1),
  ('https://x.com/YsKR51c45KE6fAs/status/2086376320867635580', 'https://pbs.twimg.com/media/HPRMLmLboAAEYCa.jpg', 2)
) as v(url, thumb, ord)
where s.slug = 'bRVna6ES'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

-- mmjcDRkP タイトルから会社名を外す
update public.spots set title = '日光市山口の工場跡', updated_at = now()
where slug = 'mmjcDRkP' and title = 'キリン乳業（株）関東工場';

commit;

-- 確認用：埋め込みの数と、表紙になる写真
select s.slug, s.title, count(e.id) as embeds, count(e.thumbnail_url) as with_photo
from public.spots s left join public.spot_embeds e on e.spot_id = s.id
where s.slug in ('KM5aKcco', 'o5t5vXLu', 'gf7SinSV', 'ncUNG4h3', 'gE3dSWYN', 'sTsoVeXe', '7gRLUSMJ', 'ZMkEuArd', 'XBXoFcN3', 'GL4Ht6wV', 'bRVna6ES', 'mmjcDRkP')
group by s.slug, s.title order by s.slug;
