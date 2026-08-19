-- スポットに紐付けるSNS埋め込み機能
-- 「SNSで話題になっている場所」をスポット詳細画面で紹介できるようにする。
-- platform列は将来的な拡張(X/TikTok等)を見据えて用意しているが、
-- 現状アプリ側で埋め込み表示に対応しているのは 'instagram' のみ。
-- 投稿者本人が、自分のスポットに対してのみ追加・削除できる(RLSで制御)。
create table public.spot_embeds (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  platform text not null default 'instagram' check (platform in ('instagram')),
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index spot_embeds_spot_id_idx on public.spot_embeds (spot_id);

alter table public.spot_embeds enable row level security;

create policy "spot embeds are viewable by everyone"
  on public.spot_embeds for select
  using (true);

-- 自分が投稿者であるスポットに対してのみ追加できる
create policy "spot owners can add embeds"
  on public.spot_embeds for insert
  with check (
    exists (
      select 1 from public.spots
      where spots.id = spot_embeds.spot_id
        and spots.author_id = auth.uid()
    )
  );

-- 自分が投稿者であるスポットの埋め込みのみ削除できる
create policy "spot owners can delete embeds"
  on public.spot_embeds for delete
  using (
    exists (
      select 1 from public.spots
      where spots.id = spot_embeds.spot_id
        and spots.author_id = auth.uid()
    )
  );
