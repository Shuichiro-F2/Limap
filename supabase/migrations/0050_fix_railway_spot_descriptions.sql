-- 廃線跡の公式スポット2件の説明文を、出典で確かめた内容に直す（2026-10-12）
--
-- コラム記事「廃線跡のリミナルスペース」を書くときに、自治体・観光団体・文化庁の情報で確かめたところ、次の点が違っていた・確かめられなかった。
-- 大棚トンネル：山口県の観光サイトでは「石積み＋煉瓦アーチ造り」で、全体が赤レンガ造りではない。
--   船木鉄道は1916年開業・1961年廃止だが、大棚トンネルのある万倉〜吉部は1944年に休止されている（トンネルの完成は1926年）。
--   「石炭輸送に使われた」は公式・報道の出典で確かめられなかったので外す。
-- 幌加駅跡：糠平〜十勝三股の列車がバス代行になったのは1978年12月、士幌線の廃止は1987年3月なので「9年も前」ではなく「8年あまり前」。
--   「廃止時にはすでにほぼ無人地帯」は確かめられなかったので外す。ホームは2017年に国の登録有形文化財になっている（文化遺産オンライン）。
-- 説明文が書いたときから変わっていたら直さない（md5 で確かめる）。日本語と英語を同じく直す。

update public.spots
  set description = '山口県宇部市の東吉部、旧船木鉄道の線路跡に残るトンネル。石を積んだ壁に、レンガのアーチが組まれている。船木鉄道は1916年に開業し、1926年に吉部まで延びたが、このトンネルのある万倉〜吉部は戦時中の1944年に休止され、1961年に全線が廃止された。木々に囲まれた坑口は、別の時代への入り口のように静かに口を開けている。中は暗く足元が悪く、近くには民家もあるので、静かに外から眺めたい。',
      description_en = 'A tunnel on the old track bed of the former Funaki Railway in Higashi-Kibe, Ube, Yamaguchi. Its stone walls are topped with a brick arch. The Funaki Railway opened in 1916 and reached Kibe in 1926, but the section between Mankura and Kibe, where this tunnel stands, was suspended during the war in 1944, and the whole line closed in 1961. Surrounded by trees, the portal stands quietly open like an entrance to another era. It is dark inside with poor footing, and there are houses nearby, so please look at it quietly from outside.'
  where slug = 'qqCxVs6h'
    and md5(description) = 'f564b613e21685fdea8347cf96943c5c'
    and md5(description_en) = '8ae21996cdb4534853bcd0203791edc9';

update public.spots
  set description = 'かつて林業で賑わった、上士幌町の旧国鉄士幌線の駅跡。1978年12月に糠平〜十勝三股の列車がバスに置き換えられ、路線そのものは1987年3月に廃止された。ホームは2017年に国の登録有形文化財になり、線路とポイントも残されている。草に埋もれつつある軌道がまっすぐ森の奥へと伸びる光景は、まるで時間だけが取り残されたかのような静けさを湛えている。町全体がヒグマの生息地なので、訪ねるときは気をつけたい。',
      description_en = 'The site of a station on the former JNR Shihoro Line in Kamishihoro, once busy with the forestry industry. In December 1978 trains between Nukabira and Tokachi-Mitsumata were replaced by buses, and the line itself was abolished in March 1987. The platform was registered as a national Tangible Cultural Property in 2017, and the tracks and a set of points also remain. The line, slowly disappearing into the grass, runs straight into the depths of the forest with a stillness as if only time had been left behind. The whole town is brown bear habitat, so take care when you visit.'
  where slug = 'AjQzCCkp'
    and md5(description) = 'c67b2d41dd9b8c1e09c287f409861069'
    and md5(description_en) = '5380bef9742a2cd40c86e3e19bfb4f17';
