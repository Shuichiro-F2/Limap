-- プロフィールバッジ機能
-- 「公式」マークを皮切りに、将来的なスポンサー・アンバサダー等の
-- バッジ種別を、アプリ側のコード変更なしに追加できるようにするための
-- マスタテーブル(badge_types) + profiles側の紐付けカラム。
--
-- 新しいバッジ種別を追加したいときは、badge_types に1行INSERTし、
-- 対象ユーザーの profiles.badge_type_key をそのkeyに更新するだけでよい
-- (アプリ側はkeyを見て未知のバッジでも汎用スタイルで表示する)。

create table public.badge_types (
  key text primary key,               -- 'official' / 'sponsor' / 'ambassador' など
  label_ja text not null,             -- バッジの表示ラベル(日本語)
  label_en text not null,             -- バッジの表示ラベル(英語)
  icon_name text not null default 'checkmark-circle', -- Ionicons のアイコン名
  bg_color text not null default '#3B82F6',  -- バッジの背景色(hex)
  text_color text not null default '#FFFFFF', -- バッジの文字/アイコン色(hex)
  created_at timestamptz not null default now()
);

alter table public.badge_types enable row level security;

-- バッジ種別の定義自体は誰でも閲覧可能(バッジの表示に必要なため)。
-- insert/update/deleteのポリシーは意図的に用意しない。
-- => 一般ユーザーやアプリからは追加・変更できず、Supabaseダッシュボード/
--    service_roleキー経由でのみ管理する(≒運営だけが付与できる)。
create policy "badge types are viewable by everyone"
  on public.badge_types for select
  using (true);

-- プロフィールに付与するバッジ種別(nullなら未付与)
alter table public.profiles
  add column badge_type_key text references public.badge_types(key) on delete set null;

-- まずは「公式」バッジを1種類だけ用意しておく
insert into public.badge_types (key, label_ja, label_en, icon_name, bg_color, text_color)
values ('official', '公式', 'Official', 'checkmark-circle', '#3B82F6', '#FFFFFF')
on conflict (key) do nothing;

-- 既存の公式アカウント(scripts/seed/create-official-account.mjs で作成したもの)に
-- 「公式」バッジを付与する。
-- OFFICIAL_USERNAME を指定していなければデフォルトの 'limap_official' が使われているはず。
-- 別のusernameで作成した場合は、下記の 'limap_official' 部分を実際のusernameに書き換えてから実行してください。
update public.profiles
  set badge_type_key = 'official'
  where username = 'limap_official';
