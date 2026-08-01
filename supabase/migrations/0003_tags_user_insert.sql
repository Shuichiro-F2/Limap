-- タグをユーザーが自由に追加できるようにする（固定リストの廃止）
-- name はユニーク制約済みのため、重複タグの作成はDB側で自然に防がれる
create policy "authenticated users can create tags"
  on public.tags for insert
  with check (auth.role() = 'authenticated');
