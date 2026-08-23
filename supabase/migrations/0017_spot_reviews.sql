-- 既存スポットに他ユーザーが「レビュー」として投稿を追加できる機能。
-- spotsテーブル自体は投稿者(author_id)が1人の想定のまま変更せず、
-- 同じ場所についての追加の訪問記録(写真・SNS埋め込み・コメント・訪問時間帯)を
-- 別テーブルとして紐付ける形にする。spots本体と同じ構成(画像・SNS埋め込みは
-- それぞれ別テーブル)を踏襲する。
create table public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  description text,
  recommended_visit_time text check (recommended_visit_time in ('morning', 'daytime', 'dusk', 'night')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spot_reviews_spot_id_idx on public.spot_reviews (spot_id, created_at desc);

alter table public.spot_reviews enable row level security;

create policy "spot reviews are viewable by everyone"
  on public.spot_reviews for select
  using (true);

create policy "authenticated users can insert own reviews"
  on public.spot_reviews for insert
  with check (auth.uid() = author_id);

create policy "authors can update own reviews"
  on public.spot_reviews for update
  using (auth.uid() = author_id);

create policy "authors can delete own reviews"
  on public.spot_reviews for delete
  using (auth.uid() = author_id);

-- spot_review_images: レビュー1件に複数枚
create table public.spot_review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.spot_reviews(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.spot_review_images enable row level security;

create policy "spot review images are viewable by everyone"
  on public.spot_review_images for select
  using (true);

create policy "authors can manage own review images"
  on public.spot_review_images for all
  using (
    exists (
      select 1 from public.spot_reviews
      where spot_reviews.id = spot_review_images.review_id
      and spot_reviews.author_id = auth.uid()
    )
  );

-- spot_review_embeds: レビュー1件あたりのSNS埋め込み(Instagram/X)
create table public.spot_review_embeds (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.spot_reviews(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'x')),
  url text not null,
  thumbnail_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index spot_review_embeds_review_id_idx on public.spot_review_embeds (review_id);

alter table public.spot_review_embeds enable row level security;

create policy "spot review embeds are viewable by everyone"
  on public.spot_review_embeds for select
  using (true);

create policy "authors can add own review embeds"
  on public.spot_review_embeds for insert
  with check (
    exists (
      select 1 from public.spot_reviews
      where spot_reviews.id = spot_review_embeds.review_id
      and spot_reviews.author_id = auth.uid()
    )
  );

create policy "authors can delete own review embeds"
  on public.spot_review_embeds for delete
  using (
    exists (
      select 1 from public.spot_reviews
      where spot_reviews.id = spot_review_embeds.review_id
      and spot_reviews.author_id = auth.uid()
    )
  );
