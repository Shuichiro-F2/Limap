-- visits: 「行った」場所の記録（2026-10-06）
--
-- 「行きたい」（bookmarks）とは別に、実際に訪れた場所を残せるようにする。訪問の記録は、その人の行動範囲が
-- 分かってしまうため、bookmarks と同じく本人にだけ見える（他のユーザーからは非公開。件数も数えない）。
-- 新しいテーブルを足すだけなので、古いアプリには影響しない（後方互換）。

create table if not exists public.visits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  spot_id uuid not null references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.visits enable row level security;

drop policy if exists "users can view own visits" on public.visits;
create policy "users can view own visits"
  on public.visits for select
  using (auth.uid() = user_id);

drop policy if exists "users can add own visits" on public.visits;
create policy "users can add own visits"
  on public.visits for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own visits" on public.visits;
create policy "users can delete own visits"
  on public.visits for delete
  using (auth.uid() = user_id);
