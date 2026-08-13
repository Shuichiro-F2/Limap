-- 投稿詳細画面で「いいね数」「保存（行きたい）数」を誰でも見られるようにするため、
-- spots に集計用のカウンタ列を追加し、likes/bookmarks の増減に合わせてトリガーで更新する。
-- （毎回COUNTクエリを発行せずに済むよう、report_countと同じ非正規化の考え方を踏襲する）

alter table public.spots add column like_count int not null default 0;
alter table public.spots add column bookmark_count int not null default 0;

-- 既存データの初期値を実際の件数から埋める
update public.spots s
set like_count = coalesce((select count(*) from public.likes l where l.spot_id = s.id), 0);

update public.spots s
set bookmark_count = coalesce((select count(*) from public.bookmarks b where b.spot_id = s.id), 0);

create or replace function public.handle_like_count_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.spots set like_count = like_count + 1 where id = new.spot_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.spots set like_count = greatest(like_count - 1, 0) where id = old.spot_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_added
  after insert on public.likes
  for each row execute function public.handle_like_count_change();

create trigger on_like_removed
  after delete on public.likes
  for each row execute function public.handle_like_count_change();

create or replace function public.handle_bookmark_count_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.spots set bookmark_count = bookmark_count + 1 where id = new.spot_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.spots set bookmark_count = greatest(bookmark_count - 1, 0) where id = old.spot_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_bookmark_added
  after insert on public.bookmarks
  for each row execute function public.handle_bookmark_count_change();

create trigger on_bookmark_removed
  after delete on public.bookmarks
  for each row execute function public.handle_bookmark_count_change();
