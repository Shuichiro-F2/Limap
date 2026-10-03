-- 海外の公式スポットの説明文を点検し、誤り・古い情報・流用の疑いのあるものを直す（2026-10-03）
--
-- 2026-09-13 に登録した海外の公式スポット100件を、公式サイト・自治体・報道・Wikipedia などで確かめた結果、
-- 事実の誤り（数値・年・形の描写）、古い情報（閉鎖・改修・再公開）、Wikipedia 英語版などの記述順をなぞった文章、
-- 立入禁止・予約制・撮影禁止なのに注意が無いもの、ダッシュ「——」を多用した文体が見つかったため、
-- 直す必要のある86件を、確かめた事実だけで LIMap 独自の言葉で書き直す（問題の無かった14件はそのまま）。
-- 人が住んでいる集合住宅（23件）は、どれも住民への配慮の一文を入れたうえで公開を続ける（Shu の判断、2026-10-03）。
-- 説明文が点検したときのまま（md5 が一致する）のときだけ書き換えるので、その後に直したもの（0038 で直した2件など）は上書きしない。

begin;

-- 8QNryKdW クングストレードゴーデン駅（Kungsträdgården）（rewrite）
update public.spots set description = 'ストックホルム地下鉄ブルーラインの東の終点で、1977年に開業した。ホームは地下約34メートルの岩盤の中にあり、美術家ウルリック・サミュエルソンが構内の装飾を手がけた。緑や赤に塗られた岩肌のあいだに、市中心部の再開発で取り壊された建物の彫像や装飾の断片が置かれ、地中に沈んだ庭園のような空気が漂う。ここから南へ延びる新線の工事が進み、2026年夏には駅が一時閉鎖された。', updated_at = now()
where slug = '8QNryKdW' and md5(description) = 'ebb7eb5f7d84a2ba8a13f549dea67135';

-- Lw7vXA3V パリ・シャルル・ド・ゴール空港 第1ターミナル（Terminal 1）（fix）
update public.spots set description = 'パリ＝シャルル・ド・ゴール空港で最も古いターミナルで、1974年に開業した。設計は建築家ポール・アンドリューで、直径約190メートルの円形のコンクリートの建物の中心を吹き抜けが貫き、透明なチューブに包まれたエスカレーターが空中で交差しながら渡っていく。周囲の搭乗棟とは地下通路で結ばれる。2023年までに大規模な改修が行われた。乗り継ぎ客がまばらな時間帯には、巨大な装置の内部に取り残されたような感覚になる。', updated_at = now()
where slug = 'Lw7vXA3V' and md5(description) = '6cac43b553d3415ce60df652b8b14dd2';

-- bDmapNGx レ・ゼスパス・ダブラクサス（Les Espaces d’Abraxas）（fix）
update public.spots set description = 'パリ東郊ノワジー＝ル＝グランにある集合住宅群で、リカルド・ボフィルの設計により1982年ごろ完成した。「パラシオ」「テアトル」「アルク」の3棟からなり、プレキャストコンクリートで古典建築の列柱やアーチをかたどる。人の背丈をはるかに超える古典様式が広場を囲む光景は舞台装置のようで、『未来世紀ブラジル』や『ハンガー・ゲーム』の撮影にも使われた。今も多くの人が暮らす住宅なので、住民や住戸を写さないよう配慮したい。', updated_at = now()
where slug = 'bDmapNGx' and md5(description) = 'd274625372f4fa7eed2bb630a16c5520';

-- 2Vu5Nvv7 マドリード・バラハス空港 第4ターミナル（Terminal 4）（fix）
update public.spots set description = 'マドリード＝バラハス空港の第4ターミナルで、2006年2月に開業した。設計は英国のリチャード・ロジャース・パートナーシップ（現RSHP）とスペインのエストゥディオ・ラメラで、同年のRIBAスターリング賞を受けた。竹で仕上げた波打つ天井をY字形の鉄骨の柱が支え、柱の色は端から端へ少しずつ虹のように移り変わる。天窓の光が落ちる同じ形の空間が延々と続き、人の少ない時間帯は距離の感覚が薄れていく。', updated_at = now()
where slug = '2Vu5Nvv7' and md5(description) = '53121cb40d8b16a7c75bf639850dd29e';

-- Cc7VvnrT ソルナ・セントルム駅（Solna Centrum）（fix）
update public.spots set description = 'ストックホルム近郊ソルナ市の地下鉄駅で、1975年8月にブルーラインの開業とともに開かれた。岩盤をむき出しにしたホームの天井は一面赤く塗られ、壁にはおよそ1キロにわたって緑のトウヒの森が描かれて、夕焼けの森が駅を囲む。アンデシュ・オーベリとカール＝オーロヴ・ビョルクの作品で、1970年代のスウェーデンで議論された環境破壊や地方の過疎化を題材にしている。列車が去ると、赤い岩の洞窟に静けさが戻る。', updated_at = now()
where slug = 'Cc7VvnrT' and md5(description) = 'fe6b2e935e86ba0f6449b83dbbff8af2';

-- etS9YLnP TWAフライトセンター（TWA Flight Center）（fix）
update public.spots set description = 'ニューヨークのジョン・F・ケネディ国際空港にある旧ターミナルで、エーロ・サーリネンの設計により1962年に開業した。翼を広げたような薄いコンクリートのシェル屋根と曲面だけでできた室内が特徴で、赤いカーペットを敷いたチューブ状の通路が搭乗棟へ延びていた。2001年に閉鎖されたのち、2019年に「TWAホテル」のロビーとして再開した。曲面の白い通路を歩くと、1960年代の未来像の中に閉じ込められたような気分になる。', updated_at = now()
where slug = 'etS9YLnP' and md5(description) = 'a29be825dbc10029f755e448a54ca385';

-- VVXMdSMV バービカン・エステート 高架歩廊（Barbican Estate）（fix）
update public.spots set description = 'ロンドン中心部シティにある大規模な集合住宅群で、チェンバリン・パウエル・アンド・ボンの設計により1965年から1976年にかけて建てられた。約2000戸を収め、3棟の高層タワーは完成当時ロンドンで最も高い住宅だった。歩行者を地上の車道から切り離す高架歩廊「ハイウォーク」が建物のあいだを何層にも巡り、迷いやすいため足元に道案内の黄色い線が引かれている。住民の暮らす場所なので、住戸や住民用の庭を写さないよう配慮したい。', updated_at = now()
where slug = 'VVXMdSMV' and md5(description) = 'bbbd255b03c57d260789a98cfeda7c01';

-- x3hoBYtV アルセナーリナ駅（Арсенальна／Arsenalna）（fix）
update public.spots set description = 'ウクライナの首都キーウの地下鉄駅で、1960年に開業した。ホームは地下約105.5メートルにあり、長く世界一深い地下鉄駅とされてきたが、2022年に開業した中国・重慶の紅岩村駅に抜かれた。ドニプロ川右岸の高台にあるためで、地上からは2段の長いエスカレーターを乗り継いで5分ほどかけて降りる。2022年からのロシアの侵攻では避難場所として使われた。渡航には最新の安全情報の確認が欠かせない。', updated_at = now()
where slug = 'x3hoBYtV' and md5(description) = '5f3c56bbd99c295d9401666afc6ca523';

-- pjaXkzcy オルドス・康巴什（カンバシ）新区 市民広場（fix）
update public.spots set description = '中国・内モンゴル自治区オルドス市の新市街で、2004年ごろから100万人規模を見込んだ建設が進み、2006年には市政府も移った。入居が追いつかず、2009年ごろから「ゴーストタウン」として世界に報じられたが、その後人口は増え、今は10万人以上が暮らす。広場の周りには、MADが設計した金属の塊のようなオルドス博物館や、本を並べたような図書館、モンゴルの頭飾りを思わせる大劇院が並び、広大な舗装面に人影はまばらだ。', updated_at = now()
where slug = 'pjaXkzcy' and md5(description) = 'bb780cc404aa03270f5cbd2431556275';

-- DvnXSY6X ソーク研究所 中央広場（Salk Institute）（fix）
update public.spots set description = 'カリフォルニア州ラホヤにある生物学研究所で、ジョナス・ソークの依頼でルイス・カーンが設計し、1965年に完成した。向かい合う研究棟のあいだはトラバーチン敷きの広場で、建築家ルイス・バラガンの助言で植栽を置かず、中央に細い水路を1本通すだけにした。水路の先には太平洋の水平線が開け、春分と秋分の頃にはその延長線上に夕日が沈む。現役の研究施設のため、中庭は予約制の建築ツアーでのみ見学できる。', updated_at = now()
where slug = 'DvnXSY6X' and md5(description) = '2a954d284fe5927b517d64e7c6ff238e';

-- Lmb9MUUi ラルダールトンネル（Lærdalstunnelen）（rewrite）
update public.spots set description = 'ノルウェー西部のラルダールとアウルランを結ぶ全長約24.5キロの道路トンネルで、2000年に開通した。道路トンネルとしては世界最長とされる。車で20分ほどかかる単調な道のりの途中に大きな岩の空洞が3か所あり、そこだけが青い光と縁の黄色い光で照らされる。灰色の管を走り続けた先に、急に青い洞窟が開ける。2026年9月から2年ほどは改修工事のため、毎晩18時から翌朝6時まで通行止めになる。', updated_at = now()
where slug = 'Lmb9MUUi' and md5(description) = '827d5e4bbeb83808b5e14f7020908607';

-- auXGVFFE 国民の館／議事堂宮殿（Palatul Parlamentului）（fix）
update public.spots set description = 'ルーマニア・ブカレストにある議会の建物で、旧称は「国民の館」。チャウシェスク政権の命で1984年に着工し、工事は1997年まで続いた。設計の中心は建築家アンカ・ペトレスクで、延床面積は約36万5000平方メートル、部屋数は約1100室にのぼり、世界で最も重い建物とされる。建設のため旧市街の広い範囲が取り壊され、約4万人が移転させられた。大理石の大広間と長い廊下が続き、内部は見学ツアーで入ることができる。', updated_at = now()
where slug = 'auXGVFFE' and md5(description) = '12cf12851239aa1a35849f4ecacc72a5';

-- Db7cLF5y オリエンテ駅（Gare do Oriente）（fix）
update public.spots set description = 'リスボン北東部にある鉄道・地下鉄・バスの乗換駅で、1998年のリスボン万博に合わせて同年5月に開業した。設計はサンティアゴ・カラトラバ。高架のホームを覆う屋根は、白い鋼の柱が上で枝分かれしてガラス屋根を支える構造で、ヤシの林やゴシック聖堂の天井にたとえられる。枝の間から落ちる光がホームに網目の影を描き、列車の間隔が空くと、白い骨組みと影だけが広がる。どこかへ向かう途中の人しかいない場所でもある。', updated_at = now()
where slug = 'Db7cLF5y' and md5(description) = '759b639a1250711a2caebc94b26ae2a8';

-- EozrwoNy 美麗島駅 光之穹頂（Formosa Boulevard Station）（fix）
update public.spots set description = '台湾・高雄の地下鉄で、レッドラインとオレンジラインが交わる乗換駅。2008年に開業した。円形のコンコースの天井を、イタリア出身のガラス作家ナルシサス・クアグリアータによるステンドグラス「光之穹頂」が覆う。直径約30メートル、4500枚を超えるガラスからなり、「水」「土」「光」「火」の4つの主題で、生命の誕生から滅び、再生までをめぐる。人の流れが途切れると、地下の大きな万華鏡の底に立っているような気分になる。', updated_at = now()
where slug = 'EozrwoNy' and md5(description) = 'ae310302812ceeb23494eeb6a343f43c';

-- sNq4kVMo ソーコル駅（Сокол／Sokol）（fix）
update public.spots set description = 'ロシア・モスクワの地下鉄ザモスクヴォレツカヤ線の駅で、1938年9月に開業した。名前は近くの協同組合住宅地「ソーコル村」から。地下約10メートルの浅い駅で、中央に一列に並ぶ柱が上で広がり、2本の白いヴォールトを支える。柱の間の天井には丸いくぼみが連なり、照明の光をそこで反射させる造りになっている。白い曲面だけが反復するホームは、列車が去るとどこにも属さない広間のようになる。渡航には最新の安全情報の確認が欠かせない。', updated_at = now()
where slug = 'sNq4kVMo' and md5(description) = 'cf38c10ac1e2130608f38893eb94e7cf';

-- kEXNdF9Y マリーナ・シティ 螺旋駐車場（Marina City）（fix）
update public.spots set description = 'シカゴ川沿いに並ぶ、バートランド・ゴールドバーグ設計の円筒形ツインタワーで、65階建ての塔は1960年代前半に完成した。上層は扇形の住戸と半円のバルコニーが放射状に並ぶ集合住宅で、下の19階分は外壁のない螺旋状の駐車場になっている。駐車は係員が行う方式で、車が円周をたどって少しずつ上がっていく様子は外からもよく見える。夜、照明に浮かぶ螺旋の床は、同じ景色が積み重なった都市の空洞のようだ。上は住まいなので、眺めるのは外からにしたい。', updated_at = now()
where slug = 'kEXNdF9Y' and md5(description) = 'b356806c4fcb55785f8f0c5f9d58d8f7';

-- F8ZXZ5kV トレリック・タワー（Trellick Tower）（fix）
update public.spots set description = 'ロンドン西部に立つ31階建ての公営住宅で、エルノ・ゴールドフィンガーの設計により1972年に完成した。住戸棟とは別に細いエレベーター塔が立ち、3階ごとに架かる渡り廊下だけで本体とつながる。エレベーターもその階にしか停まらないため、廊下は住宅の内とも外ともつかない場所になっている。完成後に荒れた時期を経て、住民の働きかけで管理が改善され、1998年にグレードII*の指定建造物となった。今も人が暮らす建物なので、見るのは外からにしたい。', updated_at = now()
where slug = 'F8ZXZ5kV' and md5(description) = '6dee96f008950be3322f9c3d468cffcf';

-- zsDBzZX3 ペナイン・タワー（Pennine Tower, Lancaster Services）（fix）
update public.spots set description = 'M6高速道路のランカスター・サービスエリアに立つ、管制塔のような形の塔。1965年の開業時には、高さ約20mの最上部に給仕付きのレストランと展望デッキがあり、モーカム湾や周囲の丘を見渡せた。非常時の避難経路を確保できないことから1989年に一般向けの営業を終え、その後しばらく事務所や倉庫として使われたが、いまは空いたままになっている。2012年にグレードIIの指定建造物となった。下のサービスエリアは営業中だが、塔の上には上がれない。', updated_at = now()
where slug = 'zsDBzZX3' and md5(description) = 'a16c8db0046318bf7206981f7e922e52';

-- HhBNjW66 アレクサンドラ・ロード・エステート／ロウリー・ウェイ（Alexandra Road Estate, Rowley Way）（rewrite）
update public.spots set description = 'ロンドン北部カムデンの公営住宅で、ニーヴ・ブラウンの設計により1972〜78年に建てられた。鉄道に面した8階建ての棟が列車の音を遮り、その内側を車の入らない歩行者用の通りロウリー・ウェイがゆるやかに曲がりながら続く。両側には階段状に後退するテラス住戸が並び、似た手すりや開口部が奥まで繰り返される。1993年、戦後の公営住宅として初めてグレードII*に指定された。約520戸に今も人が暮らしているので、撮影は住民と住戸に配慮して静かに。', updated_at = now()
where slug = 'HhBNjW66' and md5(description) = '3914b387eaa79bba99f32c4de0b31800';

-- JMeEx2vN ヴォーンパルク・アルターラー（Wohnpark Alterlaa）共用部（fix）
update public.spots set description = 'ウィーン南西部にある、約3,200戸に約9,000人が暮らす大規模な住宅団地。ハリー・グリュックらの設計で1973〜85年に建てられ、長さ約400mの棟が3列に並ぶ。屋上と屋内のプール、ショッピングセンター、診療所、学校などが団地の中にそろい、地下の駐車場や通路が棟どうしをつないでいる。蛍光灯の並ぶ長い通路は、誰かが通り過ぎるまでの間、行き先を忘れたような静けさを持つ。住民の生活の場なので、共用部での撮影や立ち入りには配慮が必要。', updated_at = now()
where slug = 'JMeEx2vN' and md5(description) = 'd7eb045599ff60a248b7a47251002cbd';

-- Rxz5y2My モンスタービル 益昌大廈の中庭（Monster Building, Quarry Bay）（fix）
update public.spots set description = '香港・鰂魚涌にある、益昌大廈や海山樓など5棟からなる住宅群。1960年代に建てられ、E字形に連なる棟が細長い中庭を囲む。約2,200戸の窓や室外機、洗濯物が壁一面に重なり、見上げた空は細い帯になる。中庭に入ると通りの音が遠のき、上から生活音だけが降ってくる。映画への登場をきっかけに撮影目的の訪問者が増え、2018年には許可のない撮影を禁じる掲示が出された。約1万人が暮らす住まいなので、住民の迷惑にならないようにしたい。', updated_at = now()
where slug = 'Rxz5y2My' and md5(description) = 'd31ab498ba118d0a56a5cf88026ddeaa';

-- jdR4Gh8o ビギッチ・タワーズ（Begich Towers, Whittier）（fix）
update public.spots set description = 'アラスカ州ウィッティアに立つ14階建ての建物で、人口約270人の町の住民の多くがここに住んでいる。1950年代に陸軍の施設として建てられ、いまは住戸のほか、郵便局、雑貨店、警察、市の事務所、診療所、教会などが同じ建物に入っている。学校とは地下通路でつながり、冬は外に出なくても日々の用事が済む。窓の外はフィヨルドと山、内側には同じ扉が並ぶ廊下が続く。住まいの建物なので、訪れる際は住民に配慮したい。', updated_at = now()
where slug = 'jdR4Gh8o' and md5(description) = '33e5935193988c970657ddd06ceab857';

-- BYxVgBv8 マッタラ・ラージャパクサ国際空港（Mattala Rajapaksa Intl. Airport）（fix）
update public.spots set description = 'スリランカ南部ハンバントタ近郊に2013年に開港した、同国二つ目の国際空港。建設費の大半を中国輸出入銀行の融資でまかない、年100万人の利用を見込んだが、定期便は定着せず、「世界でもっとも空いている国際空港」と報じられた。搭乗橋や出発ロビーを備えたターミナルは、便のない時間には人の気配がほとんどない。周囲はゾウの生息地でもある。近年は季節運航のチャーター便が発着し、運営の民間委託も検討されている。', updated_at = now()
where slug = 'BYxVgBv8' and md5(description) = '2762934ebfee03c3edcb7254371fd780';

-- Zi6c5ZgC アル・マダム 砂に埋もれた村（Al Madam Buried Village）（fix）
update public.spots set description = 'アラブ首長国連邦シャルジャ首長国の砂漠にある廃村。1970年代に遊牧民の定住のために建てられたとされる住宅の列とモスクが残る。住民は1990年代ごろまでに去ったといわれ、その後、砂丘が家々に流れ込んだ。敷居は砂に埋まり、部屋の床は斜面になり、壁に塗られた色だけがかつての暮らしを伝える。同じ形の家が並び、どれも同じように半分砂に沈んでいる。建物は傷んで崩れるおそれがあるので、足元と頭上に注意し、日中の暑さにも備えたい。', updated_at = now()
where slug = 'Zi6c5ZgC' and md5(description) = '53448845c28a5378d798b11413c7dd48';

-- NMmShzG7 サトーン・ユニーク・タワー（Sathorn Unique Tower）（fix）
update public.spots set description = 'バンコク中心部、チャオプラヤー川に近いサトーン地区に立つ未完成の高層マンション。1990年に着工し、1997年のアジア通貨危機で資金が尽きて工事が止まった。地下を含め49階、高さ約185mの骨組みに、柱やバルコニーを多用した新古典主義風の装飾がつき、窓のない開口部が上まで並ぶ。周囲にはホテルや新しいコンドミニアムが建ち、その隣で時間の止まった灰色の塔が立ち続けている。所有者は立ち入りを禁じているので、眺めるのは外からにしたい。', updated_at = now()
where slug = 'NMmShzG7' and md5(description) = '92e4549913d7c6ffc4b627fb204bd4b0';

-- aRBAGXS8 フォレスト・シティ（Forest City, Johor）（fix）
update public.spots set description = 'マレーシア南端ジョホール州、シンガポールとの海峡を埋め立てて造られた人工島の開発地。中国の不動産大手・碧桂園が主導し、2010年代半ばに分譲が始まって、70万人の街をうたった。しかし2023年時点の居住者は1万人に満たないと報じられ、高層棟の多くの窓は夜も暗い。手入れされた舗装や街路樹、閉じた店舗が続く通りは、人の到着を待ったまま止まっているように見える。実際に暮らす人もいるので、撮影は住民に配慮したい。', updated_at = now()
where slug = 'aRBAGXS8' and md5(description) = 'bf89657e74e4279e2ea0b244d75d31f9';

-- XAyRF28R ラ・ムラーヤ・ロハ（La Muralla Roja, Calpe）（fix）
update public.spots set description = 'スペイン東部カルペの海沿いの崖に、リカルド・ボフィルの設計で1973年に完成した50戸の集合住宅。北アフリカのカスバを手がかりにした造りで、外壁は赤から桃色、中庭や階段は青や紫に塗り分けられている。階段と通路が幾重にも折り返し、どこを上っても似た踊り場と切り取られた空に出るため、写真では平面のグラフィックのようにも見える。2019年ごろから敷地内は住民と宿泊者に限られ、一般の見学はできない。眺めるのは外からにしたい。', updated_at = now()
where slug = 'XAyRF28R' and md5(description) = '5dffbfb84a3d88ceaa47352728e86080';

-- cybiKBzm チャンディーガル キャピトル・コンプレックス（Capitol Complex）（fix）
update public.spots set description = 'インド・チャンディーガルの行政地区で、ル・コルビュジエが1950年代から設計した。高等裁判所、州議会議事堂、合同庁舎の3棟が、広いコンクリートの広場を挟んで離れて建ち、そのあいだに水盤や「オープン・ハンド」などのモニュメントが置かれている。建物どうしの距離が大きく、歩いてもなかなか近づかない感覚がある。2016年に世界遺産に登録された。現役の官庁街のため、見学は事前登録と身分証が必要なガイド付きツアーで行う。', updated_at = now()
where slug = 'cybiKBzm' and md5(description) = 'cea7652c7b10d5fb819973c733f3991e';

-- qRzDQ5vp キランバ新都市（Cidade do Kilamba）（rewrite）
update public.spots set description = 'アンゴラの首都ルアンダ郊外に、中国の中信建設（CITIC）が建てた新都市。第1期が2011年ごろに完成し、5〜13階建ての集合住宅約750棟が、色違いの外壁で碁盤目状に並ぶ。完成直後は価格が高すぎてほとんど売れず、海外メディアに「ゴーストタウン」と呼ばれたが、値下げや住宅ローンの支援で2013年以降に入居が進み、いまは10万人を超える人が暮らすとされる。同じ形の棟が繰り返す眺めは今も独特。住宅地なので撮影は住民に配慮して。', updated_at = now()
where slug = 'qRzDQ5vp' and md5(description) = '75187ba449d51f452d75441726b2b658';

-- mAp7XKRg ボンベイビーチ ドライブイン（Bombay Beach Drive-In, Salton Sea）（fix）
update public.spots set description = 'カリフォルニア州ソルトン湖の東岸、海抜マイナス68mにある小さな町。湖は1905年に用水路から川の水があふれてできたもので、1950〜60年代には湖畔のリゾートとしてにぎわったが、塩分の上昇や魚の大量死で人が離れた。いまの人口は200人あまり。町はずれの「ドライブイン」は、芸術祭ボンベイビーチ・ビエンナーレに関わるアーティストが廃車やボートを並べた作品で、白いトレーラーをスクリーンに見立てている。周りには住まいもあるので静かに見たい。', updated_at = now()
where slug = 'mAp7XKRg' and md5(description) = 'b610598ae90e3da5f1119f7ee55e0c10';

-- qDakyLU3 コールマンスコップ（Kolmanskop）（fix）
update public.spots set description = 'ナミビア南部、リューデリッツ近郊にあるドイツ植民地時代の鉱山町。1908年に鉄道作業員がダイヤモンドを見つけたことから町が築かれ、病院や劇場、製氷工場まで備えた。1928年に南方でさらに豊かな鉱床が見つかると人が移り、1956年に無人になった。その後、ナミブ砂漠の砂が建物に入り込み、淡い色の壁のあいだで床は斜面に変わり、廊下も砂に埋もれている。立入制限区域の中にあるため、見学には許可が必要で、現地のツアーの案内に従う。', updated_at = now()
where slug = 'qDakyLU3' and md5(description) = '01da310828ed41180522e883053ae770';

-- 3mPAPYhW シンシナティ未成地下鉄（Cincinnati Subway）リバティ通り駅（fix）
update public.spots set description = 'シンシナティのセントラル・パークウェイの地下に眠る、未完成の地下鉄。1920年に着工したが、物価の高騰や政治的な対立で1927年に資金が尽き、線路が敷かれないまま工事が止まった。3km余りのトンネルと、リバティ通りを含む4つの地下駅がほぼ形を保って残り、ホームの縁や柱の列はあるのに、列車は一度も来ていない。いまは水道管が通り、一般向けの見学は行われていない。市が活用案を募っているが、無断で立ち入ることはできない。', updated_at = now()
where slug = '3mPAPYhW' and md5(description) = '037ccf983b66ea4fc2c4e3664f222448';

-- srv9hfS7 オールドウィッチ駅（Aldwych, 休止中の地下鉄駅）（fix）
update public.spots set description = 'ロンドンのストランド通りにある、ピカデリー線の短い支線の終点だった駅。1907年にストランド駅として開業し、利用者が少ないまま、古いエレベーターの更新費が見合わないとして1994年に閉鎖された。第二次大戦中は防空壕として多くの人が夜を過ごし、大英博物館の収蔵品も近くのトンネルに避難した。いまは撮影や、ロンドン交通博物館の見学ツアー「Hidden London」のときだけ扉が開く。列車の来ないホームには古いタイルと静けさが残る。', updated_at = now()
where slug = 'srv9hfS7' and md5(description) = '52849be1b1665a2392d4c2d70a16e6cf';

-- UNSoSSWk 泰晤士小鎮／テムズタウン（Thames Town, 上海松江）（fix）
update public.spots set description = '上海市の郊外開発計画「一城九鎮」のひとつとして、2006年ごろに完成した英国風の街。約1平方キロの敷地に石畳の通りやヴィクトリア朝風の家並み、赤い電話ボックス、ブリストルの教会を模した教会が並ぶ。1万人が住む想定だったが、住民は長く2千人台にとどまってきた。中心部には観光客や婚礼写真の撮影隊が訪れる一方、住宅区画は門で閉ざされ、通りの奥ほど人の気配が薄い。どこかに似ていて、どこでもない街並み。', updated_at = now()
where slug = 'UNSoSSWk' and md5(description) = '4aa40600ee7c3466ce14f900c12f4213';

-- 79p4o7ue サラエボ五輪 ボブスレー・リュージュ競技場（Trebević）（fix）
update public.spots set description = '1984年サラエボ冬季五輪のため、トレベヴィッチ山の斜面に築かれた全長約1300m、13のカーブをもつコンクリートのコース。五輪後もワールドカップに使われたが、1990年代の紛争では砲撃陣地となり、その後は放置された。いまは森の中をU字の樋がうねりながら下り、壁はグラフィティで覆われている。周辺の森には地雷の危険が残る区域もあるため、コースと整備された道から外れないこと。', updated_at = now()
where slug = '79p4o7ue' and md5(description) = '26b2c56819fe26ef3d278e65144e12c9';

-- 55S5FZeL クーバーペディ 地下の街（Coober Pedy dugouts）（fix）
update public.spots set description = '世界の宝石質オパールの多くを産する南オーストラリアの砂漠の町。夏は40度を超える日が続くため、住民の半数ほどが岩を掘り抜いた住まい「ダグアウト」で暮らす。地下には教会やホテルもあり、掘り跡の残る室内は一年中23度前後に保たれる。地上には採掘の残土の山が点々と続き、人影はまばら。ダグアウトの多くは個人の住宅なので見学は公開施設で。採掘地には無数の縦穴があり、標識のない場所には入らないこと。', updated_at = now()
where slug = '55S5FZeL' and md5(description) = '24fc2325f74ac3c4aad88deda4d8aa57';

-- rTGPj4y9 モントリオール地下街 RÉSO／中央駅コンコース（Gare Centrale）（fix）
update public.spots set description = '冬の寒さが厳しいモントリオールでは、1962年のプラス・ヴィル・マリー開業をきっかけに地下通路がつながり、総延長約32kmの地下網になった。1943年開業の中央駅のコンコースはアール・デコ様式で、両端の大きな窓の下に、カナダの産業や暮らしを描いたチャールズ・コンフォートの浮き彫りが並ぶ。そこから通路はモールやオフィス、地下鉄駅へと枝分かれし、外の天気も時刻も分からないまま歩き続けることになる。', updated_at = now()
where slug = 'rTGPj4y9' and md5(description) = '14993878a4ee71847f2331e99838df32';

-- 7XgJ2pw4 アシガバート 白い大理石の街区（Aşgabat）（fix）
update public.spots set description = '1991年の独立後、首都の中心部は白い大理石張りの建物で次々に建て替えられ、2013年には「白大理石の建物がもっとも密集する都市」としてギネス世界記録に認定された（543棟）。官庁も集合住宅も同じ白で揃い、広い大通りや金色のドーム、彫像の並ぶ広場が続くが、歩く人の姿は少ない。整いすぎた街並みは実物大の模型のようにも見える。官庁や大統領府などの撮影は禁じられており、警察に止められることがあるので注意。', updated_at = now()
where slug = '7XgJ2pw4' and md5(description) = '8ec9e8770fbd434d67d09a9f388f2e36';

-- o7nfsxtg カラブルマの塔／トブラローネ（Kula u Karaburmi）（fix）
update public.spots set description = '1963年完成、建築家リスタ・シェケリンスキ設計の17階建ての集合住宅。三角形に突き出したテラスがジグザグに連なる外観から「トブラローネ」と呼ばれる。完成当時は周りに高い建物がなく、その形は笑いや議論の的にもなった。いまも低い家並みの中から塔だけが唐突に立ち上がり、ユーゴスラビア時代の未来像をそのまま残している。現在も人が暮らす住宅なので、外から静かに眺め、住戸や住民にカメラを向けないこと。', updated_at = now()
where slug = 'o7nfsxtg' and md5(description) = '5742ea0330030a12c4275ee0f1b9f57e';

-- fFLMGMbg ボンド・ストリート駅 エリザベス線連絡階段（Bond Street, Elizabeth line）（fix）
update public.spots set description = 'エリザベス線のボンド・ストリート駅は、路線の開業から5か月遅れて2022年10月に開業した。既存の地下鉄より大きな断面のトンネルを、クリーム色のガラス繊維補強コンクリートの曲面パネルが継ぎ目少なく覆い、照明は壁を柔らかく照らす間接光が中心になっている。どの駅も同じ部材と同じ光で揃えられているため、曲面の通路や階段に立つと、自分がどの駅にいるのか分からなくなる。', updated_at = now()
where slug = 'fFLMGMbg' and md5(description) = '8c04536d085acd32d544f2900f249735';

-- 5c4qXbrK ロードヒューセット駅（Rådhuset）岩盤の洞窟ホーム（fix）
update public.spots set description = '1975年開業。掘削した岩盤を平らに仕上げず、凹凸を残したまま赤みを帯びた色で塗り、洞窟のような空間にした駅。芸術家シグヴァルド・オルソンは、クングスホルメン島の歴史の断片が柔らかな土に埋もれ、いま姿を見せたという想定で、煙突の基礎や17世紀の門口、市場の道具などを壁に埋め込んだ。列車が去ると岩肌の下にエスカレーターの音だけが残り、都市の地下というより地層の中に迷い込んだように感じられる。', updated_at = now()
where slug = '5c4qXbrK' and md5(description) = 'c5882a82d7f60a9160241348aa67628d';

-- 9dLFK2qh ニテロイ現代美術館（MAC Niterói）赤いスロープ（fix）
update public.spots set description = '1996年開館、オスカー・ニーマイヤー設計。グアナバラ湾に突き出した岩場に、直径50mの皿のような展示棟が円筒形の基部に載り、足元を水盤が囲む。入口へは赤いスロープが地面から大きく弧を描いて上がり、歩くうちに湾と対岸の景色がゆっくり回り込む。内部では中央の展示室を窓の帯が取り巻き、リオデジャネイロの街やポン・ジ・アスーカルが見渡せる。建物に入る前の坂道そのものが、到着を引き延ばす通路になっている。', updated_at = now()
where slug = '9dLFK2qh' and md5(description) = '25b38d2b4c49affbcf7a5d54d8f2e6a4';

-- JNp6eaQC ヤムスクロ 平和の聖母大聖堂（Basilique Notre-Dame de la Paix）（fix）
update public.spots set description = '1989年完成、翌年に教皇ヨハネ・パウロ2世が献堂した。サン・ピエトロ大聖堂を手本にした設計で、ドームの高さは158m、堂内に約1万8千人（座席7千）、前の広場には30万人が入るとされ、ギネス世界記録では世界最大の教会とされる。初代大統領ウフェ＝ボワニが故郷ヤムスクロに建てたもので、ふだんのミサでは広い堂内の大半が空いたまま、ステンドグラスの光が誰もいない座席の上を移ろっていく。', updated_at = now()
where slug = 'JNp6eaQC' and md5(description) = '7d93860f4e31a14c3751bf4ed81c148f';

-- 2yNy9E97 コムソモーリスカヤ駅（Комсомольская）環状線ホーム（fix）
update public.spots set description = '1952年開業、アレクセイ・シューセフ設計。白い漆喰のバロック風装飾に黄色い丸天井が続き、シャンデリアが連なって下がる。天井にはパーヴェル・コーリンによる8枚のモザイクがはめ込まれ、ロシア史上の将軍や戦いを描く。床は赤い花崗岩。宮殿のような意匠が地下37mの乗換駅に置かれ、機能と装飾の釣り合いがどこか取れていない。列車が去った直後、豪奢な天井の下に一人残ると、ここが何のための部屋なのか分からなくなる。', updated_at = now()
where slug = '2yNy9E97' and md5(description) = 'ac446938914829f4857eb3dbc0c7babf';

-- UUa8yY66 テルメ・ヴァルス（7132 Therme, Vals）石の浴場（fix）
update public.spots set description = '1996年完成、ピーター・ズントー設計の温泉施設。地元で切り出したヴァルス産の片麻岩約6万枚を層状に積み、山の斜面に半ば埋め込むように建てられている。天井の細いすき間から光が落ち、温度の違う湯の小部屋が石の通路でつながる。谷へ開いた大きな窓のほかは石と水と暗がりが続き、目的地のないまま湯の中を移ろうことになる。宿泊者以外は事前予約が必要で、浴場内では撮影を控えるよう求められている。', updated_at = now()
where slug = 'UUa8yY66' and md5(description) = 'debd7e957a1be8b01a7cd6f1c57163c6';

-- 65CEvUYF ボストン市庁舎前広場（City Hall Plaza）（fix）
update public.spots set description = '1968年完成の市庁舎と、その前に広がる約3ヘクタールのレンガ敷きの広場。上の階ほど外へせり出したコンクリートの庁舎が、長く木陰の少ない舗装の上に置かれてきた（2022年の改修で樹木や遊び場が加わった）。ヨーロッパの広場を手本にしながら、広すぎて日常の人通りでは埋まらず、冬は風が吹き抜け、夏はレンガの照り返しが強い。斜めに横切る人影と、庁舎の窓の格子だけが規則正しく繰り返される。', updated_at = now()
where slug = '65CEvUYF' and md5(description) = 'b4aab70a91e728b933753aee1b708cc9';

-- eJ7VP53r 彩虹邨（Choi Hung Estate）駐車場屋上のバスケットコート（fix）
update public.spots set description = '1962〜64年に建てられた、香港でも古い部類の公共住宅団地。住棟の外壁は赤・橙・黄・緑・青の帯で塗り分けられている。立体駐車場の屋上にあるバスケットコートからは、色の帯と同じ形の窓が並ぶ壁面が正面にそびえ、写真では奥行きが消えたように見える。2024年に段階的な建て替えが決まり、この眺めにも期限がある。いまも多くの人が暮らす団地なので、コートを使う人の邪魔をせず、住戸や住民にカメラを向けないこと。', updated_at = now()
where slug = 'eJ7VP53r' and md5(description) = '73ed9153af4fb23ba368214573b5a2d9';

-- GGaTzjiy トレド駅（Toledo）（rewrite）
update public.spots set description = '2012年開業、ナポリ地下鉄1号線の駅。設計はスペインの建築家オスカル・トゥスケツ。地上から地下深くまで円錐形の吹き抜け「光のクレーター」が貫き、内側を覆う青いモザイクを、ロバート・ウィルソンのLED作品が刻々と色を変えて照らす。長いエスカレーターで青の中を下っていくと、海の底へ沈んでいくような感覚になる。人の途切れた時間には、人工の深海に一人取り残されたような静けさがある。', updated_at = now()
where slug = 'GGaTzjiy' and md5(description) = 'b5ab10cec0b283ede81442aff2a71893';

-- BZHyPP3o オヘア空港ターミナル1 地下連絡通路「The Sky’s the Limit」（rewrite）
update public.spots set description = 'シカゴ・オヘア空港ターミナル1で、ユナイテッド航空のBコンコースとCコンコースを結ぶ地下通路。1987年、ヘルムート・ヤーン設計のターミナルとともに完成し、天井にはマイケル・ヘイデンによる長さ約227mのネオン作品「The Sky’s the Limit」が続く。466本のネオン管が色を変えながら流れ、『ラプソディ・イン・ブルー』を編曲した音楽が低く鳴る。保安検査の内側にあるため、通れるのは搭乗客だけ。', updated_at = now()
where slug = 'BZHyPP3o' and md5(description) = '0f5ce030648b4164d953199edb604748';

-- aMYSkmHZ コスモナフトラル駅（Kosmonavtlar / Космонавтлар）（fix）
update public.spots set description = '1984年開業、宇宙をテーマにしたタシケント地下鉄の駅。ホームの壁は濃い青から淡い青へ移る陶板で覆われ、ガガーリンやテレシコワ、ウルグ・ベク、ガリレオなど、天文と宇宙開発にかかわる人物を描いた円形の陶板が並ぶ。天井には線状の照明とガラスの星がちりばめられ、天の川を思わせる。列車が去った直後の誰もいないホームでは、ソ連時代に描かれた未来像だけが青い壁に残っている。', updated_at = now()
where slug = 'aMYSkmHZ' and md5(description) = '9f128218c08e1494808bf6299da49f1f';

-- sjnJteVJ 旧エルベトンネル（Alter Elbtunnel）（rewrite）
update public.spots set description = '1911年開通、ハンブルクのエルベ川の下をくぐる長さ約426mのトンネル。両岸のドーム屋根の建物から大きなエレベーターや階段で水面下約24mまで降り、タイル張りの2本の管を歩いて対岸へ渡る。白い壁には、魚やカニ、貝、さらにネズミや捨てられたゴミまで表した小さな陶製レリーフが等間隔に並ぶ。2019年からは歩行者と自転車だけが通れる。人の途切れた時間には、百年前のタイルの管が消失点までまっすぐ続く。', updated_at = now()
where slug = 'sjnJteVJ' and md5(description) = '5a69b15f3baabb8d9536bf3d96302b7d';

-- SxcZ69LR ポンテ・シティ 中央吹き抜け（Ponte City）（fix）
update public.spots set description = '南アフリカ・ヨハネスブルグのベリア地区に建つ円筒形の高層集合住宅。1975年に完成し、高さは約173メートル。建物の中心を円形の吹き抜けが上まで貫き、底から見上げると同じ窓の列が輪になって空まで続く。1990年代の荒廃期には、この吹き抜けの底に数階分の高さまでごみが積もったとされる。改修を経た今は再び多くの人が暮らす住宅なので、内部へは無断で立ち入らず、住民の生活に配慮したい。', updated_at = now()
where slug = 'SxcZ69LR' and md5(description) = '6bf40c30020b5ba2ae5c58145dcab495';

-- odS8ze5z ヌオーヴォ・コルヴィアーレ（Nuovo Corviale）（rewrite）
update public.spots set description = 'ローマ南西の郊外に建つ公営集合住宅で、マリオ・フィオレンティーノを中心とする建築家のグループが設計した。1975年に着工し、1982年から入居が始まった。長さ約1キロの一棟に約1200戸が入り、「セルペントーネ（大蛇）」とも呼ばれる。商店や公共施設に充てるはずだった4階は計画どおりに使われず、長く住まいとして占拠されてきたが、近年は住戸への改修が進む。今も多くの人が暮らす住宅なので、内部へは立ち入らないこと。', updated_at = now()
where slug = 'odS8ze5z' and md5(description) = '68ac8751de7058f439c44e4e7e8f50ea';

-- ETbKd2jH ブルジュ・アル・ババス（Burj Al Babas）城の谷（fix）
update public.spots set description = 'トルコ北西部ボル県ムドゥルヌの近くにある、未完成のまま止まった別荘地。2014年に工事が始まったが、開発会社が2018年に経営破綻し、計画732棟のうち建てかけの587棟が丘の斜面に残った。尖塔と円錐の屋根を持つ同じ形の小さな城が等間隔に並び、どの通りに立っても同じ景色が繰り返される。誰も暮らしたことのない街の形だけがある。敷地は柵で囲まれ警備員もいるため、無断で入らず外から眺めたい。', updated_at = now()
where slug = 'ETbKd2jH' and md5(description) = '48df917b2d218561658f0ee429324d2e';

-- UdwmdZmu ジェネクス・タワー／西の門（Genex Tower）（rewrite）
update public.spots set description = 'ベオグラードの新市街ノヴィ・ベオグラードに建つ高層建築で、正式名は「ベオグラードの西の門」。ミハイロ・ミトロヴィッチの設計で1970年代の終わりに完成した。住宅棟とオフィス棟の2本の塔を二層のブリッジがつなぎ、頂部には回転するはずだったレストランが載る。空港から市内へ向かう道路沿いに、街の入口を示す門として計画された。2021年に文化財に指定。住宅棟には今も人が暮らすので、住民に配慮したい。', updated_at = now()
where slug = 'UdwmdZmu' and md5(description) = 'c44bc8f41b7e2de9f827fec402c8a9af';

-- VE2WnRAp プレストン・バスステーション（Preston Bus Station）（rewrite）
update public.spots set description = 'イギリス北西部プレストンのバスターミナル。1969年10月に開業し、設計はビルディング・デザイン・パートナーシップ（BDP）、構造はオヴ・アラップが担った。上階の立体駐車場の縁を白い曲面のコンクリートがくるみ、何層もの水平線が長く続く。解体案を乗り越えて2013年にグレードIIの指定建造物となり、改修を経て2018年に再開業した。便の合間には、長い待合の通路に同じ扉とベンチだけが並ぶ。', updated_at = now()
where slug = 'VE2WnRAp' and md5(description) = '087309a1a48e155d35487a63e5e810ce';

-- HTpfFcWy 芸術科学都市（Ciutat de les Arts i les Ciències）（fix）
update public.spots set description = 'スペイン・バレンシアの文化施設群。1957年の大洪水のあと流路を移したトゥリア川の旧河床に、1996年から建設が始まり、1998年から2009年にかけて順に開館した。大半はサンティアゴ・カラトラバの設計で、水族館はフェリックス・キャンデラが手がけた。目の形のプラネタリウム、骨組みのような科学博物館、アーチの並ぶ遊歩道が細長い敷地に一列に並ぶ。建物どうしの間は広く、浅い水盤と白い舗装面ばかりが続く。', updated_at = now()
where slug = 'HTpfFcWy' and md5(description) = 'a91c747a9bc91522c3a62d4d6a6532d9';

-- rvEs5gKL ムゼウムスインゼル駅（U-Bahnhof Museumsinsel）星空のホーム（fix）
update public.spots set description = '2021年に開業したベルリン地下鉄U5の駅。一部がシュプレー川の運河（クプファーグラーベン）の下にあり、地盤を凍らせる工法で掘り進めて造られた。ホームの天井は群青色で、6662個の小さな光が星空のように散らばる。設計はマックス・ドゥードラーで、シンケルが描いたオペラ『魔笛』の夜の女王の舞台背景がもとになっている。ホームは地下約16メートル。列車が去ると、人工の夜空の下に足音だけが残る。', updated_at = now()
where slug = 'rvEs5gKL' and md5(description) = 'f44fbf3c77198b91219d2f9556adc901';

-- zEybC8RS メウゼバンカー／ネズミの要塞（Mäusebunker）（fix）
update public.spots set description = 'ベルリン南西部リヒターフェルデに建つ旧動物実験施設で、「ネズミの要塞」を意味するメウゼバンカーの通称で呼ばれる。ゲルト・ヘンスカとマグダレーナ・ヘンスカらの設計で1971年に着工し、中断を挟んで1981年に完成した。打ち放しコンクリートの細長い台形の塊で、斜めの外壁から青い換気管が突き出す。2019年ごろに使われなくなり、解体も検討されたが、2023年に文化財として残すことが決まった。敷地には入れないので外から眺めたい。', updated_at = now()
where slug = 'zEybC8RS' and md5(description) = 'e34ce2aed7acb94a8a45883d49ad0418';

-- z2qWaUEB 勵德邨（Lai Tak Tsuen）円筒形住棟の内側（fix）
update public.spots set description = '香港島・大坑の公共住宅団地で、1975年から1976年にかけて完成した。3棟のうち2棟が円筒形で、香港の公共賃貸住宅では唯一の形とされる。中庭を囲んで円い廊下が各階を巡り、真上を見上げると同じ形の手すりと扉が輪になって空まで重なる。上下の区別が薄れ、内側と外側だけが残るような空間。今も多くの人が暮らし、入口には暗証番号式の門があって住民以外の立ち入りや撮影は断られる。無断で入らず、住民の生活に配慮すること。', updated_at = now()
where slug = 'z2qWaUEB' and md5(description) = '4d3b642dc67e102b6f1ce29a4c283017';

-- eZkorbK7 世運商街（세운상가 / Sewoon Sangga）空中歩廊（fix）
update public.spots set description = 'ソウル中心部、鍾路から退渓路まで約1キロにわたって連なる商業ビル群。キム・スグンの構想をもとに1967年から1968年に8棟が建ち、現在は7棟が残る。かつては電子部品の一大市場だったが、1980年代後半に龍山へ商圏が移り、今はシャッターの下りた区画と小さな工房が混在する。棟どうしを3階の空中歩廊がつなぎ、同じ幅の通路が続くうちに何棟目にいるのか分からなくなる。ソウル市は2026年から歩廊を順に撤去する計画で、通れる区間は変わりうる。', updated_at = now()
where slug = 'eZkorbK7' and md5(description) = '58b33bf9f2faac551d96378f2c52395e';

-- 5uoQXuQ8 ヌルジョル大通り（Nurzhol Blvd）アスタナ新都心軸（fix）
update public.spots set description = 'カザフスタンの首都アスタナで、1997年の遷都後、イシム川左岸の新市街に整えられた中心軸。黒川紀章のマスタープランをもとにした軸線上にあり、大統領府アクオルダから商業施設ハン・シャティルまで、2キロあまりの歩行者用の大通りが一直線に続く。両側には官庁や高層ビルが並び、金色のガラスや青いドームが目に入る。建物も敷石も新しく生活の気配が薄いので、都市の完成予想図の中を歩いているように感じられる。', updated_at = now()
where slug = '5uoQXuQ8' and md5(description) = '54dececc569eebbaaa8fb4985808248f';

-- H3TU5VjM イタリア文明宮／四角いコロッセオ（Palazzo della Civiltà Italiana, EUR）（fix）
update public.spots set description = 'ローマ南部の新市街EURに建つ白い直方体の建物で、「四角いコロッセオ」とも呼ばれる。1942年に予定されたローマ万国博覧会のために1930年代末から建てられたが、博覧会は戦争で開かれなかった。各面に9列6段、計54のアーチが並び、どのアーチの奥も同じ深さの影になる。地上階には彫像が並ぶ。デ・キリコの絵のようだとよく形容される。2015年からはフェンディの本社で、内部は展示の会期中に1階だけが公開される。', updated_at = now()
where slug = 'H3TU5VjM' and md5(description) = 'bd72403c7b14d4c555d1682d5ca85528';

-- nAxdFr63 ハビタ67（Habitat 67）空中の路地（fix）
update public.spots set description = '1967年のモントリオール万博に合わせて、建築家モシェ・サフディが設計した集合住宅。354個のプレキャストコンクリートの箱を積み上げ、箱と箱のあいだを屋外の通路や階段がつないでいる。頭上にも足元にも別の住戸があり、どこが内でどこが外か曖昧なまま上へ折れ曲がっていく。万博の実験住宅として建てられ、今も住民が所有して暮らす。敷地は私有地なので、内部の通路はガイドツアーで見学し、住民のプライバシーに配慮すること。', updated_at = now()
where slug = 'nAxdFr63' and md5(description) = '329e2298d81b94b01fa4391365864fc4';

-- KewaKgjE ミニョカン／ジョアン・グラール大統領高架路（Minhocão, Elevado Pres. João Goulart）（fix）
update public.spots set description = 'サンパウロ中心部を走る全長約3.5キロの高架道路で、1971年に開通した。正式名は2016年に改められた「ジョアン・グラール大統領高架路」。集合住宅の窓の目の前を路面が通り、ベランダとの距離は数メートルしかない。平日の夜20時から翌朝7時までと土日祝日は車が通行止めになり、路面が歩く人のための広い床に変わる。市は2029年までに車の通行をやめる計画を持つ。沿道は住宅なので、窓の中を撮らないよう配慮したい。', updated_at = now()
where slug = 'KewaKgjE' and md5(description) = '8c40de2dbfdd367ad219fd054deef0de';

-- yZFZrRtZ レッジョ・エミリア AV メディオパダーナ駅（Reggio Emilia AV Mediopadana）（fix）
update public.spots set description = 'イタリア北部レッジョ・エミリアの高速鉄道駅で、2013年に開業した。設計はサンティアゴ・カラトラバ。13種類の白い鋼鉄の門形フレームで組んだ単位を25回繰り返し、長さ483メートルにわたって波打つ屋根を形づくる。駅は市街地から約4キロ北の郊外にあり、周りには畑と道路が広がる。列車の合間には、白いリブの下に広い空間だけが残り、都市の玄関の外に都市がないような感覚になる。', updated_at = now()
where slug = 'yZFZrRtZ' and md5(description) = '94911bba76f54d2ac3f5340c49681ab3';

-- bqxwzKhM ユニテ・ダビタシオン／シテ・ラディウズ（Unité d’Habitation, Cité Radieuse）内部通り（fix）
update public.spots set description = 'マルセイユにあるル・コルビュジエ設計の集合住宅で、1947年に着工し1952年に完成した。337戸が入り、建物の長さ方向に「内部の通り」と呼ばれる廊下が7本走る。中ほどの階の通りには商店やホテルが面し、住戸の扉は赤や黄、青などに塗り分けられている。窓のない長い廊下は薄暗く、奥へ歩いても景色が変わらない。今も人が暮らす住宅で、一般に開かれているのは商店の通りと屋上などに限られる。住戸の階へは無断で入らないこと。', updated_at = now()
where slug = 'bqxwzKhM' and md5(description) = '3522bd064cdee2be10152706d6d66208';

-- aGkQCYCw ワルデン7（Walden 7）内部の吹き抜け（fix）
update public.spots set description = '1975年完成、リカルド・ボフィルとタジェール・デ・アルキテクトゥーラが設計した集合住宅。約28m²の単位を積み重ねた400戸あまりの住戸が建物内部の中庭を囲み、そのあいだを橋のような通路が上下に渡る。外壁は赤、中庭の内壁は青いタイル。見上げても見下ろしても同じ形の通路とバルコニーが続く。いまも人が暮らす住宅なので、内部の見学は住民側が受け付ける予約制の案内に限られる。', updated_at = now()
where slug = 'aGkQCYCw' and md5(description) = '5c7fba6a481f89cf669e5e46abba377f';

-- oERyKFTJ 平壌地下鉄 復興駅（부흥역 / Puhŭng）（rewrite）
update public.spots set description = '平壌地下鉄千里馬線の駅で、1987年に栄光駅とともに開業した。地下100mほどの深さにあり、地上からは長いエスカレーターで下りる。大理石を磨き上げたホームの上にアーチ型の天井が続き、等間隔に吊られたシャンデリアの光が床に映り込む。壁には大きな壁画が掲げられ、国外からの訪問者が案内されてきた駅のひとつでもある。豪華な装飾と地下の深さが、地上から切り離された空間をつくっている。', updated_at = now()
where slug = 'oERyKFTJ' and md5(description) = '68fa6123ca1cb437f3ae523b78abf240';

-- 5VJb3WDb 柳京ホテル（류경호텔 / Ryugyong Hotel）（fix）
update public.spots set description = '1987年に着工した105階建て、高さ330mの三角錐のホテル。1992年に骨組みが最上部まで達したところで経済危機により工事が止まり、16年間コンクリートのまま放置された。2008年に工事が再開され、2011年にガラスの外装が完成、2018年からは外壁の一面がLEDの映像で光る。内部はいまも仕上げられておらず、開業していない。街のどこからでも見えるのに、中に入った人はごくわずかしかいない。', updated_at = now()
where slug = '5VJb3WDb' and md5(description) = '78ff09780656c71ba083b3017238c610';

-- EQ4XUbmu トロピカル・アイランズ／旧エアリウム飛行船格納庫（Tropical Islands, ex-Aerium）（fix）
update public.spots set description = '大型貨物飛行船CL160を造るため、1999〜2000年にカーゴリフター社が建てた格納庫。長さ360m、幅210m、高さ107mで、内部に柱のないホールとしては世界最大級とされる。会社の破綻後、2004年に屋内の熱帯リゾートとして開業した。砂浜やラグーン、約5万本の植物が茂る熱帯雨林が鋼の骨組みの下に収まり、一部の膜は透明で空が透ける。館内は一年中26度に保たれ、外の季節や天気はここまで届かない。', updated_at = now()
where slug = 'EQ4XUbmu' and md5(description) = 'de5c83d86c100a8b669f1600a09ab32f';

-- A74rJrvL 南山邨（Nam Shan Estate）階段と中庭（rewrite）
update public.spots set description = '石硤尾にある公共屋邨で、1977年に入居が始まり、1979年までに8棟がそろった。淡い緑や青に塗られた住棟が広場を三方から囲み、街市の上の平台には古い遊具が残っている。同じ形の窓と廊下が並ぶ眺めが写真で知られるようになり、撮影に訪れる人が増えた。いまも約6千人が暮らす住宅なので、訪れるときは静かに過ごし、住戸や住民にカメラを向けないよう気をつけたい。', updated_at = now()
where slug = 'A74rJrvL' and md5(description) = 'd80bf4e600d9da85a8c37d010d7f8af0';

-- GLu6uDS2 ピラミーデン（Пирамида / Pyramiden）（fix）
update public.spots set description = '1910年にスウェーデンが開き、1927年にソ連が買い取った炭鉱の町。文化宮殿、体育館、プール、温室、世界最北とされるレーニン像まで備え、1980年代には約千人が暮らしていた。1998年3月に採掘が終わり、同じ年の10月には定住者がいなくなった。寒く乾いた気候のため建物の傷みは遅く、設備の多くがそのまま残る。いまはホテルが営業し、夏は少数の職員が滞在する。ホッキョクグマが出るため、訪れるならツアーで。', updated_at = now()
where slug = 'GLu6uDS2' and md5(description) = '074f974e9e66089306382d5b1e1ce200';

-- TivYALh3 ブズルジャ記念館（Buzludzha Monument）（fix）
update public.spots set description = '1981年、ブルガリアの社会主義運動の出発点となった1891年の集会を記念して、標高1441mの山頂に建てられた円盤形の記念館。直径約60mの建物の中に円形の大ホールがあり、壁と天井を約937m²のモザイクが覆っていた。1989年の体制転換のあと手入れが止まり、屋根は破れ、モザイクは風雨で傷んだ。いまは保存工事が進められていて、内部への立ち入りは禁止されている。外から眺めるだけにしたい。', updated_at = now()
where slug = 'TivYALh3' and md5(description) = 'd7df4466998f2e09315adbdd4264b2af';

-- Dio8uQN2 ナポリ・アフラゴーラ駅（Stazione di Napoli Afragola）（fix）
update public.spots set description = '2017年に開業した、ザハ・ハディド設計の高速鉄道駅。線路の上を400mあまりにわたって曲がりながら渡る白い橋がそのまま駅舎で、中は骨のようなリブが続く曲面のコンコースになっている。ナポリ中心部から北東に約15km、周りには畑と道路が広がる。利用者は計画より少なく、広いコンコースに人影はまばらなことが多い。直線の手がかりがなく、どこまで歩いたのかが分からなくなる。', updated_at = now()
where slug = 'Dio8uQN2' and md5(description) = 'fe625bd6cf600570625c775c5c84b142';

-- GhMXEj8q パノラミコ・デ・モンサント（Panorâmico de Monsanto）（fix）
update public.spots set description = '1968年、モンサント森林公園の丘の上に開業した円形の高級展望レストラン。建築家シャヴェス・ダ・コスタの設計で、ガラス越しにリスボンの街と川を見渡せた。のちにディスコやビンゴ場、倉庫として使われ、2001年に閉鎖された。2017年に展望台として開放されたが、2023年に安全上の理由で再び閉ざされた。内部の壁はグラフィティに覆われている。いまは警備員が巡回していて中には入れないので、外から眺めるだけにしたい。', updated_at = now()
where slug = 'GhMXEj8q' and md5(description) = '50c71bf083f719bd36ef24682b670f74';

-- 9aLUxoT8 ウンベルストーン硝石工場町（Oficina Salitrera Humberstone）（fix）
update public.spots set description = '19世紀後半に開かれ、チリの硝石産業を支えた工場町。学校、劇場、ホテル、市場、船の鋼板で造ったとされるプールまで備え、1940年ごろには約3700人が暮らしていた。合成肥料の普及で硝石の需要が落ち込み、1960年に操業を終えた。雨のほとんど降らない砂漠の乾燥が建物を保ち、劇場の木の座席やプールの階段がいまも残る。2005年に世界遺産となり、現在は博物館として公開されている。', updated_at = now()
where slug = '9aLUxoT8' and md5(description) = 'b8c3c1bd7e9f08e4a4076b1fe14b482a';

-- sDGqDpaA コンソンノ 玩具の街（Consonno）（rewrite）
update public.spots set description = 'ブリアンツァの丘の上にあった中世からの小さな村を、1962年に実業家マリオ・バーニョが買い取り、遊興の町に造り替えた。ミナレット風の塔やパゴダ、中世の城を模した門、ホテル、ダンスホールが並んだが、1976〜77年の豪雨による地滑りで唯一の道路がふさがれ、町は衰えていった。いまは塔や柱廊が草木の中に残る。建物の多くは危険なため柵で囲まれた私有地で、公開時間も限られている。決められた範囲から眺めるだけにしたい。', updated_at = now()
where slug = 'sDGqDpaA' and md5(description) = 'd90f5b15f50751f8b278de566e0e04ce';

-- RpUyExpq カヤキョイ（Kayaköy）石の村（rewrite）
update public.spots set description = 'ギリシャ語でレヴィッシと呼ばれ、ギリシャ正教徒が数千人規模で暮らしていた村。1923年のギリシャ・トルコ住民交換で住民が去り、その後ほとんど人の住まないまま丘の斜面に残された。1957年の地震でも多くの家が傷んだ。屋根を失った石造りの家がおよそ500棟、斜面に沿って重なり、教会も残っている。いまは史跡として保護され、入場料を払って歩ける。崩れかけた壁も多いので足元に気をつけたい。', updated_at = now()
where slug = 'RpUyExpq' and md5(description) = 'bab09d3c566d62ec33d49136f32146b9';

-- gEpPMKQ6 エジプト新行政首都 政府地区（New Administrative Capital）（fix）
update public.spots set description = '2015年に計画が発表され、カイロの東の砂漠に建設が進むエジプトの新しい首都。予定面積は約700km²、想定人口は650万人。議会や省庁、アフリカでもっとも高いアイコニック・タワー、巨大なモスクと大聖堂が並び、幅の広い大通りが直線で交わる。2023年には多くの省庁が移り、2024年には政府の所在地として正式に動き出したが、暮らす人はまだ少なく、通りの多くは新しいまま静まっている。', updated_at = now()
where slug = 'gEpPMKQ6' and md5(description) = '974d06db6a2670db590df17576554c98';

-- ib3BSyoC スコピエ中央郵便局（Главна пошта / Skopje Main Post Office）（fix）
update public.spots set description = '1963年の大地震のあとの再建計画のなかで、建築家ヤンコ・コンスタンティノフが設計した中央郵便局。本館と塔は1974年に、放射状のコンクリートが花びらのように開く円形の窓口ホールは1982年に完成した。ホールの円屋根の下には地震と復興を描いた壁画があった。2013年の火災で円屋根と壁画が焼け、ホールは屋根のないまま残っている。本館は郵便局の事務所として使われ、ホールの修復は計画の段階にある。', updated_at = now()
where slug = 'ib3BSyoC' and md5(description) = 'ebb2a0933419fb5811d2f1eb359ebb5f';

-- QAKdeuaZ クラーコ（Craco）丘の上の廃村（rewrite）
update public.spots set description = 'マテーラ県の丘の上にある村。紀元前8世紀の墓が見つかっており、1060年の文書に名が現れる。1963年の地滑りで住民の移転が始まり、1972年の洪水、1980年の地震を経て、旧市街は完全に無人になった。住民は麓の新しい集落に移っている。周囲はカランキと呼ばれる草木の少ない浸食地形で、塔と石造りの家が丘の頂に重なって残る。旧市街には、許可されたガイドの案内でヘルメットをかぶって入る。', updated_at = now()
where slug = 'QAKdeuaZ' and md5(description) = '35dc3faa49ca478625283e6458189a23';

-- UeKBsfTf バッファロー・セントラル・ターミナル（Buffalo Central Terminal）（rewrite）
update public.spots set description = '1929年に開業したアール・デコ様式の鉄道駅。高さ約82mの塔を持ち、開業時には一日200本の列車が発着した。鉄道旅客の減少とともに使われなくなり、1979年10月の列車を最後に駅としての役目を終えた。その後は長く荒れたが、保存団体が引き継ぎ、いまはヴォールト天井のコンコースの補修工事が進められていて、2027年の再公開を目指している。工事中は建物内に入れず、催しは屋外の芝生で開かれている。', updated_at = now()
where slug = 'UeKBsfTf' and md5(description) = '78e7411db258f81fb1cd386606b66bf5';

-- xjHULppd 東大門デザインプラザ（DDP / 동대문디자인플라자）深夜のスロープ（fix）
update public.spots set description = '2014年に開業した、ザハ・ハディドとサムウ建築の設計による複合文化施設。外壁は4万5千枚あまりのアルミパネルで覆われ、その多くは大きさや曲がり方がそれぞれ異なる。壁と屋根が切れ目なくつながり、建物の輪郭がどこで終わるのか見分けにくい。屋上は歩ける公園になっていて、館内には緩やかに上るスロープが続く。深夜、照明の落ちた曲面が街灯の光だけを鈍く返し、周りの市場の喧騒が遠ざかる。', updated_at = now()
where slug = 'xjHULppd' and md5(description) = 'cf712290b73fe6ae257915a3294879d0';

-- ahMnVhLD パーク・ヒル：説明文は問題なかったが、今も人が暮らす住宅なので住民への配慮の一文を足す
update public.spots set description = description || '今も人が暮らす住宅なので、住戸や住民にカメラを向けないよう配慮したい。', updated_at = now()
where slug = 'ahMnVhLD' and md5(description) = '38a3b782ff7c00d7004f188c53dd3dfb';

-- J9ANFBvC 旧シティ・ホール駅：座標が約220m東（現役のブルックリン・ブリッジ駅のあたり）にずれていたので直す
update public.spots set lat = 40.7126, lng = -74.0067, updated_at = now()
where slug = 'J9ANFBvC' and abs(lng - (-74.0067)) > 0.001;

commit;
