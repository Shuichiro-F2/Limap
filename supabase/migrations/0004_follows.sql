-- follows: ユーザーがユーザーをフォローする機能
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);
create index follows_follower_id_idx on public.follows (follower_id);

alter table public.follows enable row level security;

-- フォロー関係（フォロワー数・フォロー数の集計含む）は誰でも閲覧できる
create policy "follows are viewable by everyone"
  on public.follows for select
  using (true);

-- 自分自身としてのみフォローを作成できる
create policy "users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

-- 自分のフォローのみ解除できる
create policy "users can unfollow their own follows"
  on public.follows for delete
  using (auth.uid() = follower_id);
