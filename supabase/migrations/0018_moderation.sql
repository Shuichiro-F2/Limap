-- iOS版リリースに向けたコンテンツモデレーション対応(Appleガイドライン1.2)。
-- これまで reports はスポット(spot_id)専用だったが、レビュー投稿・ユーザー
-- アカウントも通報できるよう汎用化する。あわせて、ユーザー同士がブロックできる
-- blocks テーブルを新設する。

-- 1) reports を汎用化(spot / review / user のいずれかを通報できるようにする)
alter table public.reports
  add column target_type text not null default 'spot' check (target_type in ('spot', 'review', 'user')),
  add column review_id uuid references public.spot_reviews(id) on delete cascade,
  add column reported_user_id uuid references public.profiles(id) on delete cascade;

-- 既存行はすべてspot通報のため、spot_idはこれまで通りNOT NULLにしたいところだが、
-- review/user通報ではspot_idを持たないため制約を緩める(整合性はCHECK制約で別途担保する)。
alter table public.reports alter column spot_id drop not null;

alter table public.reports add constraint reports_target_shape check (
  (target_type = 'spot' and spot_id is not null and review_id is null and reported_user_id is null) or
  (target_type = 'review' and review_id is not null and spot_id is null and reported_user_id is null) or
  (target_type = 'user' and reported_user_id is not null and spot_id is null and review_id is null)
);

create index reports_review_id_idx on public.reports (review_id) where review_id is not null;
create index reports_reported_user_id_idx on public.reports (reported_user_id) where reported_user_id is not null;

-- レビューの通報件数(自動非表示の閾値判定に使う)
alter table public.spot_reviews add column report_count int not null default 0;

-- 通報作成時のトリガーを、target_typeに応じて分岐するよう置き換える。
-- スポットはこれまで通り3件で自動非表示(status='hidden')。
-- レビューはユーザーの正当な投稿を誤って自動削除してしまうリスクを避けるため、
-- report_countの集計のみ行い、非表示化は運営が手動で判断する(削除機能は既存のまま利用可能)。
-- ユーザー通報は自動アクションを行わず、運営が内容を確認して対応する。
create or replace function public.handle_new_report()
returns trigger as $$
begin
  if new.target_type = 'spot' then
    update public.spots
    set report_count = report_count + 1,
        status = case when report_count + 1 >= 3 then 'hidden' else status end
    where id = new.spot_id;
  elsif new.target_type = 'review' then
    update public.spot_reviews
    set report_count = report_count + 1
    where id = new.review_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 2) blocks: ユーザーが他ユーザーをブロックする機能。
-- ブロックしたユーザーの投稿・レビューは、フィード・検索・地図・スポット詳細から
-- クライアント側で除外する(自分がブロックした相手にのみ影響する片方向ブロック)。
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocker_id_idx on public.blocks (blocker_id);

alter table public.blocks enable row level security;

-- 自分がブロックした相手の一覧のみ閲覧できる(相手からは見えない)
create policy "users can view own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "users can insert own blocks"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "users can delete own blocks"
  on public.blocks for delete
  using (auth.uid() = blocker_id);
