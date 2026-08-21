-- 投稿フォームに「Googleマップのリンク」欄を追加する。
-- 投稿者が指定した場合はそのリンクを、未指定の場合は従来通り緯度経度から
-- 生成したGoogleマップのリンクを開く(任意項目)。
alter table public.spots add column google_maps_url text;
