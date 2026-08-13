-- 各投稿に「LIMap ID」（短い英数字ID）を付与し、投稿URLのスラッグとして使う
-- （例: https://limap.jp/spot/aB3xK9pQ）。
-- 紛らわしい文字(0/O, 1/l/I)を除いた文字セットから8文字をランダム生成する。
create or replace function public.generate_limap_id()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql volatile;

alter table public.spots add column slug text;

-- 既存の投稿にもLIMap IDを付与する
update public.spots set slug = public.generate_limap_id() where slug is null;

-- 以後の新規投稿には自動的にLIMap IDが振られるようにする
alter table public.spots alter column slug set default public.generate_limap_id();
alter table public.spots alter column slug set not null;
alter table public.spots add constraint spots_slug_unique unique (slug);
create index spots_slug_idx on public.spots (slug);
