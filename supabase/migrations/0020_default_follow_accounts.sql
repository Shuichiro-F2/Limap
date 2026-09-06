-- 新規アカウント登録時に、運営が指定したアカウント(LIMap公式)を自動でフォロー済みにする。
--
-- 対象アカウントは default_follow_accounts テーブルで管理する。
-- 増やしたい/変えたいときは、このテーブルに1行INSERT / DELETEするだけでよく、
-- アプリ側のコード変更もマイグレーションも不要
-- (badge_types と同じ「行を足せば済む」設計思想に揃えている)。
--
-- Web版・アプリ版とも Supabase の同じDBを見ているため、この変更だけで両方に反映される。
-- クライアント側のコード変更・再デプロイ・OTA配信はいずれも不要。
--
-- ⚠️ このマイグレーションは1回だけ実行すること(create table を含むため再実行は失敗する)。

-- ============================================================
-- 0. 事前チェック
-- ============================================================

-- 公式アカウントが見つからない状態で流すと「適用したのに何も起きない」状態になり
-- 原因が分かりにくいため、何も作らないうちに明示的に失敗させる。
do $$
begin
  if not exists (
    select 1 from public.profiles
    where username = 'LIMap' or badge_type_key = 'official'
  ) then
    raise exception '公式アカウントが見つかりません。username=''LIMap'' または badge_type_key=''official'' のプロフィールが存在しません。実際の公式アカウントのusernameを確認し、このファイルの ''LIMap'' を書き換えてから再実行してください。';
  end if;
end $$;

-- ============================================================
-- 1. デフォルトフォロー対象アカウントのマスタ
-- ============================================================

create table public.default_follow_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  note text,                                    -- 運営向けメモ(用途が分かる説明を入れる)
  created_at timestamptz not null default now()
);

alter table public.default_follow_accounts enable row level security;

-- 「誰がデフォルトでフォローされるか」は秘匿情報ではないため select は誰でも可。
-- insert/update/delete のポリシーは意図的に用意しない
-- => 一般ユーザーやアプリからは変更できず、Supabaseダッシュボード/service_roleキー
--    経由でのみ管理できる(badge_types と同じ考え方)。
create policy "default follow accounts are viewable by everyone"
  on public.default_follow_accounts for select
  using (true);

-- 公式アカウントを登録する。
-- 0008 の badge 付与は username='limap_official' 前提だったため、badge が未設定の可能性がある。
-- username と badge のどちらでも拾えるようにしておく。
insert into public.default_follow_accounts (profile_id, note)
select id, 'LIMap公式アカウント'
from public.profiles
where username = 'LIMap'
   or badge_type_key = 'official'
on conflict (profile_id) do nothing;

-- ============================================================
-- 2. 新規プロフィール作成時に自動フォローを付与するトリガー
-- ============================================================

-- follows は profiles を参照しているため、auth.users ではなく profiles の
-- AFTER INSERT に紐づける(handle_new_user が profiles を作った直後に発火する)。
-- メール登録・Googleログイン・Appleサインインのいずれの経路でも profiles は
-- handle_new_user 経由で作られるので、この1箇所で全経路をカバーできる。
create or replace function public.apply_default_follows()
returns trigger as $$
begin
  insert into public.follows (follower_id, followee_id)
  select new.id, d.profile_id
  from public.default_follow_accounts d
  where d.profile_id <> new.id   -- 対象アカウント自身が自分をフォローしないようにする
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger on_profile_created_apply_default_follows
  after insert on public.profiles
  for each row execute function public.apply_default_follows();

-- ============================================================
-- 3. 既存ユーザーへのバックフィル
-- ============================================================

-- このマイグレーション時点で既に登録済みのユーザーにも、公式アカウントのフォローを付与する。
-- 既にフォロー済みのユーザーは on conflict で無視されるため、重複や上書きは起きない。
-- 注意: 過去に意図的にフォロー解除したユーザーにも再度付与されることになる。
insert into public.follows (follower_id, followee_id)
select p.id, d.profile_id
from public.profiles p
cross join public.default_follow_accounts d
where p.id <> d.profile_id
on conflict do nothing;

-- ============================================================
-- 確認用クエリ(適用後に実行して結果を目視するためのもの。実行は任意)
-- ============================================================
-- select p.username, d.note from public.default_follow_accounts d join public.profiles p on p.id = d.profile_id;
-- select count(*) from public.follows f join public.default_follow_accounts d on d.profile_id = f.followee_id;
