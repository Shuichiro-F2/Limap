-- spot-imagesバケットには元々select/insertのポリシーしかなく、update/deleteの
-- ポリシーが存在しなかった。そのため、投稿削除時(deleteSpot)にStorage側の
-- 画像ファイルを削除しようとしても実際にはRLSで拒否されて失敗しており
-- (アプリ側では投稿削除自体は継続できるようエラーを握りつぶしていたため気づきにくい)、
-- 削除済み投稿の画像ファイルがStorageに孤立したまま残り続けていた。
-- また、既存画像をWebPに再変換するようなメンテナンススクリプトでも、
-- 古い形式のファイルを削除できず孤立ファイルが増える原因になる。
--
-- avatarsバケット(0007_avatar_storage.sql)と同じパターンで、
-- 保存パスの先頭セグメント(auth.uid())が本人のものであれば
-- 更新・削除できるようにする。
create policy "authors can update own spot images"
  on storage.objects for update
  using (
    bucket_id = 'spot-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authors can delete own spot images"
  on storage.objects for delete
  using (
    bucket_id = 'spot-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
