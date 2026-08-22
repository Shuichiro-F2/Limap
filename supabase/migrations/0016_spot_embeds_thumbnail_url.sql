-- 埋め込み投稿(Instagram/X)から取得したサムネイル画像URLを保存する列を追加する。
-- 写真の投稿がないスポットでも、一覧のグリッド/カード表示で埋め込み投稿の
-- サムネイルを写真の代わりに使えるようにするため。
-- 投稿の作成・編集時にアプリ側(サーバーレスAPI経由)で取得して保存する運用のため、
-- DB側では特にデフォルト値やNOT NULL制約は設けない(取得できなかった場合はnullのまま)。
alter table public.spot_embeds
  add column thumbnail_url text;
