-- 投稿フォームに「おすすめの訪問時間帯」欄を追加する。
-- リミナルスペースは時間帯によって雰囲気が大きく変わるため、投稿者が最も雰囲気を
-- 感じられると考える訪問時間帯を選べるようにする(任意項目)。
alter table public.spots add column recommended_visit_time text
  check (recommended_visit_time in ('morning', 'daytime', 'dusk', 'night'));
