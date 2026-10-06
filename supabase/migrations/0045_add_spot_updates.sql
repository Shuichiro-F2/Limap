-- spot_updates: スポットの「情報が変わった」という知らせ（2026-10-06）
--
-- 公式スポットの点検で、解体済み・閉業・立入禁止になった・営業を再開した、などの古い情報が多く見つかった。
-- 訪れた人から知らせてもらえるよう、スポットの詳細のメニューから送れるようにする。
-- reports（通報）とは別にする。通報は3件で自動的に非表示になるが、こちらは運営が確かめてから説明文などを直すため。
-- 送るのに登録は要らない（未ログインでも送れる。reporter_id は空）。読めるのは運営だけ（anon・利用者からは読めない）。
-- 新しいテーブルを足すだけなので、古いアプリには影響しない（後方互換）。

create table if not exists public.spot_updates (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('demolished', 'closed', 'no_entry', 'reopened')),
  created_at timestamptz not null default now()
);

create index if not exists spot_updates_spot_id_idx on public.spot_updates (spot_id);

alter table public.spot_updates enable row level security;

-- 送るのは誰でもよい。ログインしている人は本人の id でだけ送れる（他人になりすませない）
drop policy if exists "anyone can send spot updates" on public.spot_updates;
create policy "anyone can send spot updates"
  on public.spot_updates for insert
  to anon, authenticated
  with check (reporter_id is null or reporter_id = auth.uid());

-- select のポリシーは作らない（運営が Supabase のダッシュボードで読む）
