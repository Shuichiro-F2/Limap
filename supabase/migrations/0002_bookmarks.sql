-- bookmarks: 「行きたい場所」リスト。likesとは別に、公開しない個人用の保存機能
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  spot_id uuid not null references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.bookmarks enable row level security;

-- 行きたい場所リストは本人にのみ見える（他ユーザーからは非公開）
create policy "users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "users can manage own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
