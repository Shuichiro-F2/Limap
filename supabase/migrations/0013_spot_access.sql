-- 投稿フォームに「アクセス」欄(最寄り駅からの行き方など、現地にたどり着くための
-- ヒントを書ける自由記述欄)を追加するためのカラム。任意項目なのでnull許容。
alter table public.spots add column access text;
