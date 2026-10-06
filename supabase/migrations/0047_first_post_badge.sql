-- 初めて投稿した人に「投稿者」バッジを付ける（2026-10-06）
--
-- 登録した人のほとんどが投稿しないまま（scripts/growth-stats.mjs）なので、投稿した人に返ってくるものを作る。
-- スポット（spots）か、スポットへの投稿（spot_reviews）を初めて作ったとき、バッジがまだ無い人にだけ付ける。
-- バッジは1人1つなので、「公式」などのバッジを持っている人はそのまま。
-- バッジの表示はアプリが badge_types を読んで行うので、アプリの変更は要らない（古いアプリでも出る）。
-- 付けるのはトリガー（security definer で所有者として動く）なので、0046 の保護（利用者は badge_type_key を変えられない）とは両立する。

insert into public.badge_types (key, label_ja, label_en, icon_name, bg_color, text_color)
values ('contributor', '投稿者', 'Contributor', 'footsteps', '#dece32', '#1a1a1a')
on conflict (key) do nothing;

create or replace function public.grant_contributor_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set badge_type_key = 'contributor'
    where id = new.author_id
      and badge_type_key is null;
  return new;
end;
$$;

drop trigger if exists grant_contributor_badge_on_spot on public.spots;
create trigger grant_contributor_badge_on_spot
  after insert on public.spots
  for each row execute function public.grant_contributor_badge();

drop trigger if exists grant_contributor_badge_on_review on public.spot_reviews;
create trigger grant_contributor_badge_on_review
  after insert on public.spot_reviews
  for each row execute function public.grant_contributor_badge();

-- これまでに投稿したことがある人（公式以外）にも付ける
update public.profiles p
  set badge_type_key = 'contributor'
  where p.badge_type_key is null
    and (
      exists (select 1 from public.spots s where s.author_id = p.id)
      or exists (select 1 from public.spot_reviews r where r.author_id = p.id)
    );
