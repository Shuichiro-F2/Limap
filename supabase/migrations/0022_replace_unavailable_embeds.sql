-- 元の投稿が削除・非公開になり、中身が空になっていた公式スポット5件の SNS 埋め込みを差し替える
-- （2026-09-27 に scripts/check-embeds.mjs で点検し、見られなくなっていたもの）。
--
-- 差し替え先はいずれも、同じ場所を写した写真付きの X 投稿で、公開状態であることを確認済み。
-- 1件だけだとまた消えたときに空になるため、見つかったスポットには2件目も足しておく。
--
-- 見られなくなった行を新しい投稿に書き換え（position 0）、2件目は position 1 として追加する。
-- 行の id と元の URL が一致するときだけ書き換えるので、誤って2回流しても二重には変わらない。
-- 2件目の追加も、同じ URL が既にあれば追加しない。

begin;

-- 六甲アイランド・リバーモール（NbGc4Sdz）：夜のリバーモール（六甲ライナー高架下の水路）
update public.spot_embeds
set platform = 'x',
    url = 'https://x.com/michihiroume/status/1736414638269673801',
    thumbnail_url = 'https://pbs.twimg.com/media/GBj76E0asAASGMC.jpg'
where id = '4ece7d50-7384-4a7e-b059-0513cd1bc17d'
  and url = 'https://www.instagram.com/azusa_n89/p/DBluz1OPhPx/';

-- 屯鶴峯地下壕（es2eLiRx）：地下壕の坑口
update public.spot_embeds
set platform = 'x',
    url = 'https://x.com/henro0210/status/1989971130804047880',
    thumbnail_url = 'https://pbs.twimg.com/media/G53MLgaaYAAIlMN.jpg'
where id = 'c5784e9b-e24b-4805-ab67-4a4471945b1b'
  and url = 'https://www.instagram.com/p/DNInrsHJmrl/';

insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select '578b805a-9bfb-4f61-81c6-e2d9fd7d7861', 'x', 'https://x.com/utagech/status/1931305713659416884',
       'https://pbs.twimg.com/media/Gs1feesa0AAyLmL.jpg', 1
where not exists (
  select 1 from public.spot_embeds where url = 'https://x.com/utagech/status/1931305713659416884'
);

-- 志摩地中海村（NP7tVnY3）：施設公式アカウントの街並みの写真
update public.spot_embeds
set platform = 'x',
    url = 'https://x.com/shimaamigo1/status/1893600550580846813',
    thumbnail_url = 'https://pbs.twimg.com/media/GkdqTcgXgAAlubm.jpg'
where id = 'd89b846c-2220-4804-a7c7-436d83eff921'
  and url = 'https://www.instagram.com/shima_chichuukaimura_official/p/C5LdNKjBrRb/';

-- 日光ウエスタン村（QxTyYMA9）：草に覆われた入口まわり
update public.spot_embeds
set platform = 'x',
    url = 'https://x.com/KoumeiLotte/status/1738449675475427729',
    thumbnail_url = 'https://pbs.twimg.com/media/GCA2wHNa0AAzI-8.jpg'
where id = '6d71878f-bfa2-421a-aa02-b3a7c2590ab5'
  and url = 'https://x.com/pAKL1b4a0Ln3IDi/status/1861157160912331230';

insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select 'cba34731-1467-48de-924e-37a4fbd2fe02', 'x', 'https://x.com/onomatopee55/status/2050841957161963539',
       'https://pbs.twimg.com/media/HHYN4QibUAANfot.jpg', 1
where not exists (
  select 1 from public.spot_embeds where url = 'https://x.com/onomatopee55/status/2050841957161963539'
);

-- 旧中西薬局（eKpNs9Zn）：洋風の外観
update public.spot_embeds
set platform = 'x',
    url = 'https://x.com/koki_shinshu/status/2081324073687105561',
    thumbnail_url = 'https://pbs.twimg.com/media/HOJZNdaagAAyFlY.jpg'
where id = '2a89b3be-87d9-455d-a5d1-4e71620e20b4'
  and url = 'https://x.com/CRAYHAPPYRIDE1/status/2091360844244529322';

insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select '7f2a419d-5c23-42f5-9dd1-9762dc7882f9', 'x', 'https://x.com/HimanekoSo2/status/1789930906230112483',
       'https://pbs.twimg.com/media/GNccTp1aYAArafK.jpg', 1
where not exists (
  select 1 from public.spot_embeds where url = 'https://x.com/HimanekoSo2/status/1789930906230112483'
);

commit;

-- 確認用：5件とも、見られる埋め込みに置き換わっていること（合計8行）
select s.slug, s.title, e.position, e.platform, e.url
from public.spot_embeds e
join public.spots s on s.id = e.spot_id
where s.slug in ('NbGc4Sdz', 'es2eLiRx', 'NP7tVnY3', 'QxTyYMA9', 'eKpNs9Zn')
order by s.slug, e.position;
