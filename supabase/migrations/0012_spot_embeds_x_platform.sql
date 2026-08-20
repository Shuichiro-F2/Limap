-- SNS埋め込みにX(旧Twitter)投稿を追加できるようにする。
-- 0009_spot_embeds.sqlの時点では platform に 'instagram' しか許可していなかった
-- (create table内のインラインcheck制約のため、暗黙的に spot_embeds_platform_check
-- という名前が付与されている)。この制約を 'x' も許可するよう更新する。
alter table public.spot_embeds drop constraint spot_embeds_platform_check;
alter table public.spot_embeds add constraint spot_embeds_platform_check check (platform in ('instagram', 'x'));
