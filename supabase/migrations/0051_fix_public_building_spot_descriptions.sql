-- 公共建築の公式スポット3件の説明文を、出典で確かめた内容に直す（2026-10-17）
--
-- コラム記事「美術館・図書館・庁舎のリミナルスペース」を書くときに、施設・自治体・運営団体の情報で確かめたところ、次の点が違っていた・確かめられなかった。
-- 群馬音楽センター：高崎財団の施設概要では総工費は3億3千5百万円で、「3億円」ではない。
--   市民の寄付は「建設費の一部」とあるだけで、「1億円」という額は公式の資料で確かめられなかったので外す。
-- 金沢21世紀美術館：公式の建築概要では建物の直径は113m（112.5m ではない）。
-- 茅野市民館：公式の言い方は「JR茅野駅東口に直結」。「橋上駅舎から」「細長い」「高さ5m」は公式で確かめられなかったので外す。
--   図書室は、公式に「駅のホームと平行するガラス張りのスロープ沿い」にあるとされている。
-- 説明文が書いたときから変わっていたら直さない（md5 で確かめる）。日本語と英語を同じく直す。

update public.spots
  set description = '1961年に完成した、アントニン・レーモンド設計の音楽ホール。建設費の一部を市民の寄付でまかない、屏風を折ったようなコンクリートの折板構造で、柱のない大きな客席を覆っている。催しのない見学日には、照明を落としたままの誰もいない客席とロビーを歩くことができ、昭和の公共建築の気配だけが静かに残っている。',
      description_en = 'A concert hall designed by Antonin Raymond and completed in 1961. Part of its construction cost was covered by citizens'' donations, and a folded-plate concrete structure, like a folding screen, roofs the large, column-free auditorium. On tour days with no performances, you can walk through the empty auditorium and lobby with the lights left off, where only the atmosphere of Showa-era public architecture quietly lingers.'
  where slug = '74Dex6Z8'
    and md5(description) = '785c174935b2efc5e713c2687bb336e3'
    and md5(description_en) = 'ac849521df2e8d96615dd9da37d8535b';

update public.spots
  set description = '2004年に開館した、SANAA（妹島和世・西沢立衛）設計の美術館。芝生の真ん中に直径113mの円形のガラスの建物が置かれ、白い通路と中庭が迷路のようにつながる。無料の交流ゾーンは夜22時まで開いていて、人の減った夜には、どちらが表でどちらが裏なのか分からなくなる。',
      description_en = 'An art museum designed by SANAA (Kazuyo Sejima and Ryue Nishizawa), opened in 2004. A circular glass building 113 m in diameter sits in the middle of a lawn, with white corridors and courtyards linked like a maze. The free public zone stays open until 10 p.m., and at night, when the visitors thin out, it becomes hard to tell which side is the front and which is the back.'
  where slug = 'dibLtfvP'
    and md5(description) = '061d1690c05ba125ee661e8f86e78eff'
    and md5(description_en) = '73332237c6bd8e5b4883265a649e7620';

update public.spots
  set description = '2005年に開館した、古谷誠章設計の文化施設。JR茅野駅の東口に直結していて、駅を出るとそのままなだらかなスロープで建物の中へ入り、駅と建物の境目がはっきりしない。図書室は駅のホームと平行するガラス張りのスロープ沿いにあり、列車を待つ場所と本を読む場所がガラスを隔てて並ぶ。通り過ぎるための空間。',
      description_en = 'A cultural center designed by Nobuaki Furuya, opened in 2005. It connects directly to the east exit of JR Chino Station: you leave the station and walk straight into the building along a gentle slope, and the line between station and building blurs. The library sits along a glass-walled slope that runs parallel to the station platform, so a place for waiting for trains and a place for reading sit side by side, separated by glass: a space made for passing through.'
  where slug = '698Asdpz'
    and md5(description) = 'adf8e125c0c695de38346657f1c02e93'
    and md5(description_en) = 'c95a87a5a36fea505b303e045a89efc1';
