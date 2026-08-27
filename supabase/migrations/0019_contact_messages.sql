-- 運営へのお問い合わせをアプリ内の会話(スレッド)形式に対応させる。
-- ユーザーは1件の進行中スレッドで運営とやり取りでき、運営(管理者)は
-- 専用の管理画面からすべてのスレッドを閲覧・返信できるようにする。
--
-- 注意: 以前のバージョンのこのファイルでは単発メッセージ用のcontact_messages
-- テーブルを作成していたが、それを会話形式に置き換えるため、
-- 既にそちらを実行済みの場合でも安全なようdrop if existsから始める。

-- 1) 管理者フラグ。trueのアカウントのみ管理画面にアクセスできる。
alter table public.profiles add column if not exists is_admin boolean not null default false;

drop table if exists public.contact_messages cascade;
drop table if exists public.contact_threads cascade;

-- 2) 問い合わせスレッド。ユーザー1人につき基本的に1つの進行中スレッドを想定する。
create table public.contact_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'other' check (category in ('bug', 'request', 'other')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  -- 最新メッセージの時刻。管理画面での一覧を「動きがあった順」に並べるために使う。
  updated_at timestamptz not null default now()
);

create index contact_threads_user_id_idx on public.contact_threads (user_id);
create index contact_threads_updated_at_idx on public.contact_threads (updated_at desc);

-- 3) スレッド内の個々のメッセージ。ユーザー本人の発言・管理者の返信の両方をここに格納する。
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.contact_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  is_admin boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create index contact_messages_thread_id_idx on public.contact_messages (thread_id);

-- メッセージが追加されるたびに、スレッドのupdated_atを更新する。
-- また、ユーザー本人からの新規メッセージが来た場合は、closedになっていても
-- 自動的にopenへ戻す(運営からの返信ではステータスは変更しない。
-- 対応完了の判断は管理画面から手動で行う)。
create or replace function public.handle_new_contact_message()
returns trigger as $$
begin
  update public.contact_threads
  set updated_at = now(),
      status = case when not new.is_admin then 'open' else status end
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_contact_message_created
  after insert on public.contact_messages
  for each row execute function public.handle_new_contact_message();

alter table public.contact_threads enable row level security;
alter table public.contact_messages enable row level security;

-- スレッド: 本人は自分のスレッドのみ、管理者は全スレッドを閲覧できる。
create policy "users can view own threads, admins view all"
  on public.contact_threads for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- スレッドの新規作成は本人のみ(管理者が代理作成することは想定しない)。
create policy "users can insert own threads"
  on public.contact_threads for insert
  with check (auth.uid() = user_id);

-- ステータス変更(対応完了/再オープン)は管理者のみ許可する。
create policy "admins can update threads"
  on public.contact_threads for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- メッセージ: そのスレッドの本人、または管理者のみ閲覧・投稿できる。
create policy "participants can view messages"
  on public.contact_messages for select
  using (
    exists (
      select 1 from public.contact_threads t
      where t.id = contact_messages.thread_id
      and (
        t.user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
      )
    )
  );

create policy "participants can insert messages"
  on public.contact_messages for insert
  with check (
    sender_id = auth.uid()
    -- is_admin=trueで送るには、本人が実際に管理者フラグを持っている必要がある
    -- (一般ユーザーが自分の発言を管理者からの返信であるかのように偽装できないようにする)。
    and (
      not is_admin
      or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
    )
    and exists (
      select 1 from public.contact_threads t
      where t.id = contact_messages.thread_id
      and (
        t.user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
      )
    )
  );
