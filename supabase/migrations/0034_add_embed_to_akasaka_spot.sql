-- 赤坂の公式スポット（g5SSFruW）に、展示を伝えた報道の X 投稿を埋め込みとして足す（2026-10-03）
--
-- このスポットにアップロードされている写真は Shu が撮ったものではないため、写真の代わりに元の投稿の埋め込みで見せる。
-- 使う投稿：NiEW（@NiEWJP）の 2026-09-04 の投稿。配給の @A24HPS にも触れていて、展示の写真が付いている。
-- 同じ URL の埋め込みが既にあれば足さないので、2回流しても二重にはならない。
--
-- あわせて説明文の「中には入れず」を外す。来場者の投稿から、エレベーターで2階に上がって見られる仕掛けもあったと分かったため
-- （説明文がこのファイルを作った時点のままのときだけ書き換える）。
--
-- アップロード済みの写真（g5SSFruW と otDUUTkK の各2枚）の削除は、このファイルでは行わない。
-- Shu がアプリの編集画面から消す（ストレージのファイルも一緒に消える）。

begin;

insert into public.spot_embeds (spot_id, platform, url, thumbnail_url, position)
select s.id, 'x', v.url, v.thumb, (select coalesce(max(position), -1) from public.spot_embeds e where e.spot_id = s.id) + 1
from public.spots s, (values
  ('https://x.com/NiEWJP/status/2095733931018731577', 'https://pbs.twimg.com/media/HRWDS0ca0AAAa8q.jpg')
) as v(url, thumb)
where s.slug = 'g5SSFruW'
  and not exists (select 1 from public.spot_embeds e where e.spot_id = s.id and e.url = v.url);

update public.spots set description = '赤坂の一角にある、1976年竣工の雑居ビルの2階。空室だったガラス張りの一室に、2026年9月1日から13日までの期間限定で、映画『バックルームズ』の日本公開を記念した実物大の"リアル3D広告"が展示されていた。クリエイティブチーム・PINPIN STUDIOが手がけたもので、リユース品を積み上げて劇中の空間を再現し、夜になると黄色い光が路地に浮かび上がった。通りからガラス越しに眺められる展示で、目撃した人の投稿がSNSで広まった。

展示はすでに終了し、今は通常の賃貸オフィスの空室に戻っているため、訪問は控えてほしい。'
where slug = 'g5SSFruW' and md5(description) = '958ad9f91a4fc2cd72b4589178e116b1';

commit;
