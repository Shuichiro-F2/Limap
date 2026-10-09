-- 展望室の公式スポット7件の説明文を、公式の情報で確かめた内容に直す（2026-10-09）
--
-- コラム記事「展望室のリミナルスペース」を書くときに、県・市・施設の公式の情報で確かめたところ、次の点が違っていた・確かめられなかった。
-- 群馬県庁：32階は「フロア全体」ではなく南北の展望ホール（同じ階に放送スタジオ・カフェがある）。「上毛三山」は公式の表現に無いので「県境の山々」に
-- セリオン：高さは公式で「全高143m」。「2007年から無料」は確かめられなかったので外す
-- 栃木県庁：「地上約65m」「建物をぐるりと囲む」は公式で確かめられなかったので外し、閉館日は入れないことを足す
-- 水戸芸術館の塔：形は公式の「正四面体を積み重ね」「三重らせん」の表現に
-- うみてらす14：「地上約90m」は運営者の公式ページに無いので外す
-- 余部「空の駅」：高さは県・町の公式で「約40m」
-- 東山スカイタワー：高さは公式で「全長134m」。森の遊歩道は東山公園駅から来る場合だけなので外す
-- 説明文が書いたときから変わっていたら直さない（md5 で確かめる）。日本語と英語を同じく直す。

update public.spots
  set description = '1999年に完成した、高さ153.8mの群馬県庁の32階にある展望ホール。南と北の展望ホールは無料で、夜10時まで入れる（庁舎への入館は21時45分まで）。人のいない夜のフロアから、県境の山々と関東平野の灯りを見下ろしていると、役所の中にいることを忘れてしまう。',
      description_en = 'An observation hall on the 32nd floor of the Gunma Prefectural Government Building, a 153.8-meter tower completed in 1999. The observation halls on the south and north sides are free and open until 10 p.m. (entry to the building until 9:45 p.m.). Looking out from the empty floor at night toward the mountains along the prefectural border and the lights of the Kanto Plain, you forget that you are inside a government office.'
  where slug = 'piDZag2m'
    and md5(description) = '076875508589c4cde2d03d9d588147c9'
    and md5(description_en) = '7f8e1c3e3fc8197179badb72acab6e06';

update public.spots
  set description = '秋田港の端に立つ、全高143mのガラスのタワー。1994年に開業した。地上100mの展望室には無料で上がれ、夜9時まで開いている。夜や平日の展望室は人がまばらで、日本海と港の明かりだけが窓の外に広がる。平成のはじめの空気を残した、誰もいない高い部屋。',
      description_en = 'A 143-meter glass tower at the edge of Akita Port, opened in 1994. Its observation room 100 meters above the ground is free and open until 9 p.m. At night and on weekdays the room is nearly empty, with only the Sea of Japan and the lights of the harbor spreading out beyond the windows. An empty room high in the air that still holds the atmosphere of the early Heisei years.'
  where slug = 'SAqp6opk'
    and md5(description) = '6675b69cf3d66adc5df25a9421d12caa'
    and md5(description_en) = 'dd2e769d61b318d7b5888300e0a89707';

update public.spots
  set description = '2007年に完成した栃木県庁本館の最上階、15階にある北と南の展望ロビー。平日も休日も夜9時まで自由に見学できる（県庁舎の閉館日は入れない）。閉庁後、人のいない役所の廊下から宇都宮の夜景を眺める時間は、少しだけ現実から外れた場所にいるように感じる。',
      description_en = 'North and south observation lobbies on the 15th floor, the top floor of the Tochigi Prefectural Government main building, completed in 2007. They are open to visitors until 9 p.m. on weekdays and weekends alike, except on days the building is closed. After office hours, looking out at the night view of Utsunomiya from the empty corridors of a government building, you feel as if you have stepped slightly outside of reality.'
  where slug = 'qT48wnpH'
    and md5(description) = '38329d3490fa44370d7b9f7d9ec7234c'
    and md5(description_en) = 'ba15860d8c927394f524e136b3c33542';

update public.spots
  set description = '1990年に開館した水戸芸術館の、高さ100mの塔。設計は磯崎新。正三角形のチタンのパネルで正四面体を積み重ねた形で、稜線をたどると三重のらせんになる。ガラス張りのエレベーターで上がる地上86.4mの展望室は定員19名の小さな部屋で、潜水艦のような窓から街を見下ろすと、幾何学の中に閉じ込められたような気分になる。',
      description_en = 'The 100-meter tower of Art Tower Mito, which opened in 1990. Designed by Arata Isozaki, it is made of stacked tetrahedrons clad in equilateral triangular titanium panels, and its edges trace a triple spiral. The observation room, reached by a glass elevator, sits 86.4 meters above the ground and is a small room holding just 19 people. Looking down on the city through its submarine-like windows, you feel as if you have been sealed inside a piece of geometry.'
  where slug = 'b9ekkcic'
    and md5(description) = 'cad03fa37448f84440d2a0891608ffba'
    and md5(description_en) = 'ea4af039b8ab309fa4d0dce27703fa8b';

update public.spots
  set description = '四日市港の開港100周年を記念して1999年に建てられた、高さ100mのポートビルの14階にある展望展示室。窓の外には、港と石油化学コンビナートが広がり、夜は工場群の光だけが静かにまたたく。平日の展望室は人が少なく、働き続ける工場を見下ろす、誰もいない部屋になる。',
      description_en = 'An observation and exhibition room on the 14th floor of the Port Building, a 100 m tower built in 1999 to mark the 100th anniversary of the opening of the Port of Yokkaichi. Outside the windows, the port and the petrochemical complex spread out, and at night only the lights of the factories flicker quietly. On weekdays the observation room has few visitors, becoming an empty room that looks down on factories that never stop working.'
  where slug = 'Ej6x5s75'
    and md5(description) = '685a0d6d3e97c57621f309e7f81d9409'
    and md5(description_en) = '7c3125a5be635eb164d8dfd9b44dc0a3';

update public.spots
  set description = '1986年に列車転落事故が起きた旧余部鉄橋（余部橋梁）の橋脚の一部を保存して造られた、高さ約40mの展望施設。2010年に新しいコンクリート橋に架け替えられた際、旧橋梁の一部があえて撤去されずに残され、遊歩道と展望台に生まれ変わった。眼下に日本海と余部の集落を見下ろす空中回廊は、かつて列車が走っていた線路の記憶を宿す、非日常的な高所空間。事故の記憶を伝える鎮魂の場でもある。',
      description_en = 'The "Sora no Eki" (Sky Station), an observation facility about 40 m high, built on preserved piers of the old Amarube Viaduct (Amarube Bridge), where a train fell from the bridge in an accident in 1986. When the bridge was replaced with a new concrete one in 2010, part of the old structure was deliberately left standing and reborn as a walkway and observation deck. The aerial walkway, looking down on the Sea of Japan and the village of Amarube, is an unusual high-up space that holds the memory of the tracks where trains once ran. It is also a place of remembrance that keeps the memory of the accident alive.'
  where slug = 'kk5yFE6g'
    and md5(description) = '5637c632ecdaba50a45a3f39e983fd50'
    and md5(description_en) = 'e380d3856c1158e43da6266c7d907796';

update public.spots
  set description = '東山公園の丘の上に立つ、全長134mの展望塔。名古屋市制100周年を記念して1989年に開業した。平成のはじめの空気を残す地上100mの展望室には、平日や夜、街の明かりを見下ろす人影がまばらにあるだけの静かな時間が流れる。',
      description_en = 'A 134-meter observation tower standing on a hill in Higashiyama Park. It opened in 1989 to mark the centennial of the City of Nagoya. Its observation room, 100 meters above the ground, still carries the air of the early Heisei years and has quiet hours on weekdays and at night, when only a few figures look down on the lights of the city.'
  where slug = 'trD2fyrV'
    and md5(description) = '1ee23a9823b6cdfc0293b26410fe3794'
    and md5(description_en) = '1ea828d8b9ec38956f1ad28d068a0088';
