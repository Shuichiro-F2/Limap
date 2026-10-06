-- 利用者が自分で変えてはいけない列を、運営以外が変えられないようにする（2026-10-06）
--
-- profiles と spots の update のポリシーは「本人の行なら更新できる」だけで、列の制限が無かった。
-- そのため、ログインした利用者が API を直接呼べば、次のような変更ができてしまう可能性があった。
--   - profiles.is_admin を true にする → 管理者として、ほかの人のお問い合わせ（contact_threads / contact_messages）が読める
--   - profiles.badge_type_key を 'official' にする → 「公式」バッジを名乗れる
--   - spots.status を 'published' に戻す → 通報3件で自動的に非表示になった投稿を、自分で公開に戻せる
--   - spots の like_count / bookmark_count / report_count を書き換える
-- アプリ自体はこれらの列を更新しない（lib/profiles.ts・lib/spots.ts）ので、アプリの動きは変わらない。
--
-- 守り方：更新・追加するのが利用者（ロールが anon / authenticated）のときだけ、これらの列の変更を止める。
-- いいね数などを数え直すトリガー（security definer で所有者として動く）と、運営（ダッシュボードの SQL・service_role）は
-- これまでどおり変更できる。関数は security definer にしない（current_user で、誰が変えようとしているかを見るため）。

-- 1) profiles: is_admin と badge_type_key
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.badge_type_key := null;
    elsif new.is_admin is distinct from old.is_admin
       or new.badge_type_key is distinct from old.badge_type_key then
      raise exception 'is_admin と badge_type_key は運営だけが変更できます';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- 2) spots: status と、トリガーで数えている件数
create or replace function public.protect_spot_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.status := 'published';
      new.like_count := 0;
      new.bookmark_count := 0;
      new.report_count := 0;
    elsif new.status is distinct from old.status
       or new.like_count is distinct from old.like_count
       or new.bookmark_count is distinct from old.bookmark_count
       or new.report_count is distinct from old.report_count then
      raise exception 'status といいね・保存・通報の件数は運営だけが変更できます';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_spot_privileged_columns on public.spots;
create trigger protect_spot_privileged_columns
  before insert or update on public.spots
  for each row execute function public.protect_spot_privileged_columns();
