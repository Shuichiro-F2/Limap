-- Limap 初期スキーマ
-- profiles: Supabase Auth の auth.users と1対1で紐づくプロフィール
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- スペースの雰囲気タグ（マスタ）
create table public.tags (
  id serial primary key,
  name text unique not null
);

insert into public.tags (name) values
  ('廃墟'), ('深夜'), ('無人駅'), ('地下道'), ('駐車場'),
  ('団地'), ('遊園地跡'), ('海外'), ('雨の日'), ('人工照明');

alter table public.tags enable row level security;

create policy "tags are viewable by everyone"
  on public.tags for select
  using (true);

-- spots: リミナルスペースの投稿本体
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  country text,
  city text,
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spots_lat_lng_idx on public.spots (lat, lng);
create index spots_status_idx on public.spots (status);
create index spots_created_at_idx on public.spots (created_at desc);

alter table public.spots enable row level security;

create policy "published spots are viewable by everyone"
  on public.spots for select
  using (status = 'published' or auth.uid() = author_id);

create policy "authenticated users can insert spots"
  on public.spots for insert
  with check (auth.uid() = author_id);

create policy "authors can update own spots"
  on public.spots for update
  using (auth.uid() = author_id);

create policy "authors can delete own spots"
  on public.spots for delete
  using (auth.uid() = author_id);

-- spot_images: 1投稿に複数枚
create table public.spot_images (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.spot_images enable row level security;

create policy "spot images are viewable by everyone"
  on public.spot_images for select
  using (true);

create policy "authors can manage own spot images"
  on public.spot_images for all
  using (
    exists (
      select 1 from public.spots
      where spots.id = spot_images.spot_id
      and spots.author_id = auth.uid()
    )
  );

-- spot_tags: 多対多
create table public.spot_tags (
  spot_id uuid not null references public.spots(id) on delete cascade,
  tag_id int not null references public.tags(id) on delete cascade,
  primary key (spot_id, tag_id)
);

alter table public.spot_tags enable row level security;

create policy "spot tags are viewable by everyone"
  on public.spot_tags for select
  using (true);

create policy "authors can manage own spot tags"
  on public.spot_tags for all
  using (
    exists (
      select 1 from public.spots
      where spots.id = spot_tags.spot_id
      and spots.author_id = auth.uid()
    )
  );

-- likes
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  spot_id uuid not null references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.likes enable row level security;

create policy "likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "users can manage own likes"
  on public.likes for all
  using (auth.uid() = user_id);

-- reports: 通報（事後モデレーション用）
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('inappropriate', 'privacy', 'spam', 'wrong_location', 'other')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "users can insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "users can view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- 通報が閾値を超えたら自動的に非表示にするトリガー
create or replace function public.handle_new_report()
returns trigger as $$
begin
  update public.spots
  set report_count = report_count + 1,
      status = case when report_count + 1 >= 3 then 'hidden' else status end
  where id = new.spot_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_report_created
  after insert on public.reports
  for each row execute function public.handle_new_report();

-- 新規ユーザー登録時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for spot images
insert into storage.buckets (id, name, public) values ('spot-images', 'spot-images', true)
on conflict (id) do nothing;

create policy "spot images bucket is publicly readable"
  on storage.objects for select
  using (bucket_id = 'spot-images');

create policy "authenticated users can upload spot images"
  on storage.objects for insert
  with check (bucket_id = 'spot-images' and auth.role() = 'authenticated');
