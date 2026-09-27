-- 公式スポットの説明文・アクセスの事実誤りを直す（2026-09-27 点検。145か所）
--
-- 公式スポット265件の説明文とアクセスを、公式サイト・自治体・Wikipedia・報道と照らし合わせて点検し、
-- 食い違いが見つかった箇所を直す。各行は「今の文章が点検時と同じとき（md5 が一致するとき）」だけ書き換えるので、
-- その後に手で直した文章を上書きしたり、2回流して二重に変わったりすることはない。
--
-- あわせて、
-- ・実在しない場所・重複登録・解体済み・人が住んでいる可能性のある7件を非公開にする
-- ・他サイト（廃墟検索地図）の文章とほぼ同じだった15件の説明文を、LIMap独自の文章に書き直す
-- ・営業中の新神戸オリエンタルシティから「廃墟」タグを外す

begin;

-- 滝見橋（TdJmev6C）
update public.spots set description = '栃木県日光市、鬼怒川温泉。かつて多くの団体客でにぎわった渓谷の温泉地に、バブル期の熱狂が置き去りにした光景が広がっている。

橋の上から渓谷を見渡すと、対岸の斜面には廃業した温泉旅館群が折り重なるように建ち並ぶ。窓は割れ、看板の文字は色褪せ、外壁を蔦が静かに浸食していく。かつて団体客で賑わったであろう宴会場も、露天風呂も、今はただ谷を渡る風の音だけが訪れる。

鬼怒川の流れる音、川霧が立ち込める朝、そして対岸に沈黙する巨大な建造物たち――栄華と衰退が同じフレームに収まる、この土地ならではの光景。橋自体は公共の通行路であり、対岸の廃墟に立ち入ることなく、安全な距離から一望できるのが最大の特徴。

日光という観光地の華やかなイメージのすぐ隣に、こうした景色が存在していること自体が、ある種のリミナリティを感じさせる。

ご注意
対岸に見える旧温泉旅館群はすべて私有地・廃墟であり、内部への立ち入りは不法侵入および転落等の重大な事故につながる危険があります。本スポットは橋上からの眺望を楽しむものであり、対岸への立ち入りは絶対にお控えください。', updated_at = now()
where slug = 'TdJmev6C' and md5(description) = 'a33f42174fc3cad4236d9bce64239797';

-- スパリゾートハワイアンズ スプリングパーク（HLy7yJkZ）
update public.spots set access = 'JR常磐線「湯本駅」から無料送迎バスで約15分。スパリゾートハワイアンズの館内。', updated_at = now()
where slug = 'HLy7yJkZ' and md5(access) = '4e40a513c5948a25cd6176f7c48141d0';

-- 国道駅（bUpymfK9）
update public.spots set description = '鶴見と鶴見小野の間、工場地帯の住宅地にひっそりと作られたJR鶴見線の無人駅。開業は1930年で、駅舎やホームの雰囲気は開業当時からほとんど手を加えられていないといわれています。改札を出るとすぐに現れるのは、陸橋のように長く伸びる高架下の薄暗いトンネル状の通路。青ばんだタイル張りの壁や古びた手すりは時間が止まったような雰囲気をまとい、日常の駅でありながらどこか非日常な空間としてSNSでたびたび話題になっています。日中でも薄暗いこの通路は、まさに日常と非日常の境界線上にあるリミナルスペースです。', updated_at = now()
where slug = 'bUpymfK9' and md5(description) = '862c9af834ccfb55d6d0d7b2c62ee7e0';

-- ロサ会館（W9n7DymW）
update public.spots set description = '池袋西口にそびえる、1970年代の雰囲気を色濃く残す雑居ビル。1968年に総合アミューズメントビルとして開業し、現在も映画館（シネマ・ロサ）やボウリング場、ゲームセンター、ライブハウス、飲食店などが営業を続けています。館内は昭和のアミューズメントビルらしい薄暗い照明と入り組んだ通路が特徴で、地下へ続く階段や案内表示のレトロなフォントが独特の雰囲気を醸し出します。時代から取り残されたような空間として、SNSでもたびたび「レトロ」「異空間」として紹介される、都心にありながら非日常を感じられるリミナルスペースです。', updated_at = now()
where slug = 'W9n7DymW' and md5(description) = 'ac7091544f4a501d1df8b7e6086a7c58';

-- マルカンビル大食堂（sTsoVeXe）
update public.spots set description = '花巻駅前の商業ビル「マルカンビル」6階にある、旧マルカン百貨店の大食堂を受け継ぎ、百貨店大食堂の雰囲気を今に伝える食堂。名物の「マルカンソフトクリーム」を目当てに訪れる人で長年にわたりにぎわってきました。一度は建物の古さにより閉店しましたが、地元有志の手により復活し、現在も営業を続けています。広々とした店内と高い天井には、昭和40年代後半に開業した百貨店大食堂の雰囲気がそのまま残されており、時間が止まったような不思議な感覚を味わえます。地方都市に残るレトロ食堂の代表例として、SNSでも全国から訪れる人が絶えない人気スポットです。', updated_at = now()
where slug = 'sTsoVeXe' and md5(description) = '7c70dcd159f94c49ba574757ab5fa355';

-- 敦賀鉄道資料館（旧敦賀港駅舎）（AQ8Q9NVr）
update public.spots set description = '1999年に再現された旧敦賀港駅の駅舎を使った鉄道資料館。大正期の洋風建築を忠実に再現した建物は、日本の鉄道史を伝える貴重な存在です。金ヶ崎緑地の静けさの中佇むレトロな外観と、人影の少ない周囲の雰囲気が、時間が止まったような不思議な感覚を生み出しています。夜のライトアップ時にはさらに幻想的な雰囲気をまとい、現実と過去の境界を漂うリミナル空間として注目されています。', updated_at = now()
where slug = 'AQ8Q9NVr' and md5(description) = 'e55d593c91e97547bfac3b1f25c5aa67';

-- 敦賀鉄道資料館（旧敦賀港駅舎）（AQ8Q9NVr）
update public.spots set access = 'JR敦賀駅から徒歩約30分、または周遊バスで約10分「金ヶ崎緑地」下車、金ヶ崎緑地内', updated_at = now()
where slug = 'AQ8Q9NVr' and md5(access) = '59b44701b137fead94a406c96a772241';

-- 別府温泉保養ランド（泥湯）（uN8qRiyB）
update public.spots set description = '明礬温泉郷の山中に位置する古くは風土記にも記されたという紺屋地獄の泥を引く泥湯温泉。青白色の泥がボコボコと泡を立てて湧く光景は、この世のものとは思えない不思議な光景です。山の中に湯けむりが立ちこめ、日常から隣接された別世界に足を踏み入れたような感覚に陥ります。自然の地熱エネルギーが生み出す本物の泥湯は、現実離れしたリミナル空間としてSNSでも話題を呼んでいます。', updated_at = now()
where slug = 'uN8qRiyB' and md5(description) = '9bffb8fe704ec61200fdc5d9acf06bba';

-- 行幸地下ギャラリー（fMm9FwDX）
update public.spots set description = '丸の内エリアのビル群を結ぶ地下通路で、両側に長いガラスのショーケースが続く、明るく広い地下通路です。日中はビジネスパーソンで賑わう一方、早朝や休日の人の少ない時間帯は、丸の内というビジネス街の中心にありながら静寂に包まれ、現実の喧噪から切り離されたような不思議な雰囲気を生み出します。整然と並ぶガラスのショーケースと長くまっすぐな通路がつづく景色は、日常と非日常の境界線上にあるようなリミナル空間としてSNSで注目されています。', updated_at = now()
where slug = 'fMm9FwDX' and md5(description) = '7363416891a9aa95f3d103ebf539ad5c';

-- 行幸地下ギャラリー（fMm9FwDX）
update public.spots set access = 'JR東京駅丸の内北口直結、行幸通りの地下（丸ビルと新丸ビルの間の地下通路）', updated_at = now()
where slug = 'fMm9FwDX' and md5(access) = '401c70d1388be9612dec416d1faa1bc5';

-- 六甲アイランド・リバーモール（NbGc4Sdz）
update public.spots set description = '人工島・六甲アイランドの中心を南北に貫く、水路沿いの遊歩道と広場です。かつては多くの店舗で賑わいましたが、時間帯によっては人影がまばらになります。人影がまばらな遊歩道や広場には、繁栄期の面影と静けさが同居し、時が止まったような不思議な雰囲気が漂うリミナル空間として注目されています。', updated_at = now()
where slug = 'NbGc4Sdz' and md5(description) = '21532c384eb01b9a84be18826d955eb2';

-- 六甲アイランド・リバーモール（NbGc4Sdz）
update public.spots set access = '六甲ライナー「アイランドセンター駅」下車すぐ', updated_at = now()
where slug = 'NbGc4Sdz' and md5(access) = '0005a90d8c662658b9d8d6cb1cdacc15';

-- ホテル ラ・レインボー（gTe8qwaP）
update public.spots set description = '瀬戸内海を見下ろす高台に建つ、営業を終えたホテルの廃墟です。コンクリートの躯体が緑に覆われ、時間が止まったような静けさが漂っています。老朽化が進んでいるため、敷地は立入禁止で、侵入による逮捕者も出ています。眺めるのは敷地の外からにしてください。', updated_at = now()
where slug = 'gTe8qwaP' and md5(description) = 'c0ad4be96926635992436260514fe332';

-- 尾去沢鉱山（pZ2q6Ugg）
update public.spots set description = '飛鳥時代からの採掘伝承を持つとされる、日本有数の歴史を誇る鉱山跡です。かつては史跡として一般公開されていた（2026年度からは完全予約制の見学施設）。坑道内には赤褐色の岩肌やトロッコの軌道跡が残り、地上に出ると当時の選鉱施設の遺構がひび割れたコンクリートの地面とともに静かに佇んでいます。', updated_at = now()
where slug = 'pZ2q6Ugg' and md5(description) = 'bee71368fcf2ccdc18aacbc355a68402';

-- 尾去沢鉱山（pZ2q6Ugg）
update public.spots set access = '秋田県鹿角市尾去沢、1300年以上の歴史を持つとされる鉱山跡。2026年度からは完全予約制の見学施設となっており（事前予約が必要）、赤褐色に染まった坑道や選鉱施設の跡が独特の雰囲気を醸し出す', updated_at = now()
where slug = 'pZ2q6Ugg' and md5(access) = '1c9bda7b1affd57cd04c57b41e1268f8';

-- 浅草地下街（mUJPSbt5）
update public.spots set description = '1955年に完成した、現存する地下街としては日本最古とされる浅草地下街。地下鉄銀座線の浅草駅に直結する地下商店街として浅草の商人たちが開いた歴史を持ち、天井は低く、湾曲した通路に沿って昭和の雰囲気を色濃く残す飲食店が並ぶ。蛍光灯の光と年季の入ったタイル張りの壁が独特の時間感覚を生み、観光地・浅草のすぐ地下にこれほど濃密な異世界が広がっていることに驚かされる。', updated_at = now()
where slug = 'mUJPSbt5' and md5(description) = '37dfad7424e6b97613a22f1f6315dba9';

-- 浅草地下街（mUJPSbt5）
update public.spots set access = '東武スカイツリーライン・都営浅草線・東京メトロ銀座線・東京メトロ銀座線「浅草駅」直結。東武スカイツリーライン・都営浅草線「浅草駅」からもすぐ', updated_at = now()
where slug = 'mUJPSbt5' and md5(access) = '3c98f32f9070fe69f687d3e51dba3ab2';

-- 屋上かまたえん（g3Pub95b）
update public.spots set description = '蒲田駅前の商業ビル、東急プラザ蒲田の屋上に広がる小さな遊園地「かまたえん」。都内で唯一の屋上観覧車「幸せの観覧車」があり、電車型の乗り物やふわふわ遊具とともに、1968年から続く屋上遊園地の面影を今に伝えている。眼下には駅前の雑踏、見上げれば観覧車のゴンドラという対比が独特で、ビルの隙間に取り残されたような非日常感を味わえる。', updated_at = now()
where slug = 'g3Pub95b' and md5(description) = '76c2c27b52d6f39dbe877ad426612fdf';

-- 屋上かまたえん（g3Pub95b）
update public.spots set access = 'JR・東急「蒲田駅」西口直結（京急線は京急蒲田駅から徒歩）、東急プラザ蒲田屋上（エレベーターで最上階へ）', updated_at = now()
where slug = 'g3Pub95b' and md5(access) = '152c04de95786a477d33853d0e4c02e3';

-- 旧横田医院（VjHQSWFR）
update public.spots set description = '築100年近い、大正15年築の木造病院建築がそのまま朽ちながら残る旧横田医院。診察室の医療器具や薬棚、待合室の椅子などが往時のまま置き去りにされ、時が止まったような空間が広がる。現在は撮影スタジオ・イベント会場として活用されており、怪談イベントなども開かれる、リミナルスペース愛好者にも知られたスポット。', updated_at = now()
where slug = 'VjHQSWFR' and md5(description) = '9795dce88da62be893a36569a861b827';

-- 白川湖の水没林（GE9H3gyW）
update public.spots set description = '白川ダムの湖畔に生える柳の木々が、雪解け水が流れ込む春から初夏にかけてのみ姿を現す幻の水没林。湖面が鏡のように木々を映し込み、朝もやが立ち込める時間帯には水面と空の境界が溶けて、木が宙に浮いているかのような錯覚を覚える。ダムという人工物によって生まれた、季節限定の非日常的な風景。', updated_at = now()
where slug = 'GE9H3gyW' and md5(description) = 'c3654dfd3d7b38e0d2ae5934ade504ce';

-- 白川湖の水没林（GE9H3gyW）
update public.spots set access = '車でのアクセスが基本（米坂線の今泉〜坂町間は運転見合わせ中）。シーズン中は赤湯駅からシャトルバスあり。白川湖畔オートキャンプ場周辺、白川ダム湖畔に駐車場あり', updated_at = now()
where slug = 'GE9H3gyW' and md5(access) = '662b1e2f8084c3b697143913ff27139e';

-- 旧東山隧道（花山洞）（5QyLHMCy）
update public.spots set description = '1903年（明治36年）に渋谷街道の道路トンネルとして開通し、国道1号の新しいトンネルができた後は歩行者用トンネルとして残る花山洞（花山トンネル）。れんが造りのポータルが苔むし、内部は落ち葉が敷き詰められ、鬱蒼とした木々に包まれている。歩行者や自転車が通り抜けられる状態で保存されており、静けさの中に異空間の入り口のような雰囲気が漂う。', updated_at = now()
where slug = '5QyLHMCy' and md5(description) = '1cc0ccfe4891bd938e644308799b7ca6';

-- ピエリ守山（GL4Ht6wV）
update public.spots set description = '琵琶湖のほとりに建つ大型商業施設ピエリ守山。開業当初は多くのテナントが入っていたが、次々と撤退が相次ぎ、一時はほとんどの店舗がシャッターを下ろした「明るい廃墟」として全国的な話題となった。現在は2014年の全面リニューアルを経てにぎわいを取り戻しているが、広々とした通路や吹き抜けには、かつての賑わいの記憶と静けさが同居する独特の空気が残る。', updated_at = now()
where slug = 'GL4Ht6wV' and md5(description) = 'f7dff8796c08c1f07961c5cc89e842bd';

-- ピエリ守山（GL4Ht6wV）
update public.spots set access = 'JR「守山駅」から近江鉄道バスで約25分「ピエリ守山」下車すぐ（無料シャトルバスもあり）、または名神高速「栗東IC」から車で約20分', updated_at = now()
where slug = 'GL4Ht6wV' and md5(access) = '7d5835599cc96fd6120cbd81634dd288';

-- 多摩川住宅給水塔（c6QEVJB6）
update public.spots set description = '「給水塔の聖地」とも呼ばれる多摩川住宅の一角にそびえる給水塔群。かつて5基あった塔は建て替え工事で数を減らし、今は3基が残るのみだが、住棟の間に忽然と立つ姿は現実感を欠いた独特の風景を作り出している。青空を背景に無機質な塔だけが浮かび上がる瞬間は、まさにリミナルスペースそのもの。昭和の団地文化を象徴する存在として、写真愛好家の間でひそかに人気を集めている。', updated_at = now()
where slug = 'c6QEVJB6' and md5(description) = '58e3f66c0e3612392fe7d3ce4c773dee';

-- 多摩川住宅給水塔（c6QEVJB6）
update public.spots set access = '小田急線「狛江駅」からバスまたは徒歩約20分。京王線「調布駅」「国領駅」からもバスあり。', updated_at = now()
where slug = 'c6QEVJB6' and md5(access) = 'ada510a8202499b32b902fb4f7b6d938';

-- 旧国鉄倉吉線廃線跡（竹林）（gE3dSWYN）
update public.spots set access = 'JR倉吉駅から日本交通バス（関金線）で約42分「泰久寺」下車、徒歩約15分。車の場合はせきがね廃線跡観光案内所の駐車場から徒歩15〜20分。', updated_at = now()
where slug = 'gE3dSWYN' and md5(access) = '2a5fca0131805f5861ce3a5c974ba244';

-- ホテルアトランタ（osSBC4sM）
update public.spots set description = '伊勢志摩の観光地・鳥羽市の一角に佇む、昭和40年代に開業し、2010年代初め頃まで営業していたとみられるコテージタイプのラブホテル廃墟。バブル期の華やかな内装や調度品が手つかずのまま残され、時間が止まったかのような独特の空気が漂う。植物に侵食された外観と色褪せた客室が織りなす非日常的な光景は、廃墟愛好家の間で密かに知られたスポットとなっている。', updated_at = now()
where slug = 'osSBC4sM' and md5(description) = 'e15deef7420bcd95cbf8e468ac52a0cc';

-- 高千穂橋梁（7gRLUSMJ）
update public.spots set description = '旧高千穂鉄道の高千穂橋梁は、渓谷を跨ぐ高さ約105mの日本一高い鉄道橋として知られていた。2005年の台風被害により廃線となったが、現在も橋はそのまま残され、専用の展望車両で橋上を走行する観光アトラクション「スーパーカート」として生まれ変わっている。眼下に広がる深い渓谷と、空中に浮かぶような鉄骨の直線が織りなす光景は、地上と空の狭間に立たされたような感覚を覚える圧巻のリミナルスペースだ。', updated_at = now()
where slug = '7gRLUSMJ' and md5(description) = '633c1b4cd3316dd4a6d84582e2751dfb';

-- 屯鶴峯地下壕（es2eLiRx）
update public.spots set description = '第二次大戦末期の1945年、本土決戦に備えて旧日本陸軍が航空総軍の戦闘司令所として掘削した地下壕。白い凝灰岩の奇岩地帯・屯鶴峯の斜面に、総延長約2kmの坑道網が張り巡らされており、現在も一部の坑口が口を開けたまま静かに残っている。真っ白な岩肌が広がる非日常的な景観と、暗く沈黙する壕内の対比が印象的な、戦争遺跡としてのリミナルスペース。坑内は崩落の危険があり立入禁止のため、周辺の遊歩道から坑口の様子を眺めるにとどめたい。', updated_at = now()
where slug = 'es2eLiRx' and md5(description) = '26cff9f4acbc54bc9690fc8394d4cb45';

-- 志摩地中海村（NP7tVnY3）
update public.spots set description = '英虞湾を望む高台に、白壁とテラコッタ屋根の建物が斜面にひしめき合う、地中海の漁村を再現したリゾート村。1993年の開業以来営業を続けており、日本にいながらギリシャやスペインの港町を歩いているかのような錯覚に陥る。石畳の坂道、青い扉、鐘楼を模した塔などが密集する景観は、現実の日本の海辺とは思えない浮遊感を生み出しており、夕暮れ時に人影がまばらになると特にその非日常感が際立つ。', updated_at = now()
where slug = 'NP7tVnY3' and md5(description) = '13d7ef88e3d4c5b476cfc13cbb90cec2';

-- 徳山ダム（旧徳山村水没跡）（o5t5vXLu）
update public.spots set description = 'ダムの底に沈んだかつての故郷。徳山村は岐阜県揖斐川町にあった山村で、2008年に完成した日本一の貯水量を誇る徳山ダムの建設によって村の集落のほとんどが湖底に沈んだ。466戸・約1500人が暮らした8集落が姿を消し、住民は移転を余儀なくされたが、渇水期になると水位が下がり、かつて集落があった土地の輪郭や道路、石垣の跡がうっすらと湖面から姿を現すことがある。エメラルドグリーンに輝く人造湖の静けさの奥に、かつて確かに人々の生活があった痕跡が眠っており、失われた「ふるさと」の記憶と現在の風景が重なり合う独特の浮遊感を味わえる場所。', updated_at = now()
where slug = 'o5t5vXLu' and md5(description) = 'aa4ac4dff161bee7c715123adedd4282';

-- 屋上遊園スカイランド（松坂屋高槻店）（bRVna6ES）
update public.spots set description = '昭和の匂いを色濃く残す、デパート屋上の小さな遊園地。かつて日本各地の百貨店に当たり前のように存在した「屋上遊園地」は、郊外型の巨大テーマパークの台頭とともにほとんどが姿を消し、現在も営業を続けているのは全国でわずか数か所のみ。ビルの谷間にぽっかりと浮かぶゴーカートや豆汽車、昔ながらの電動遊具が、都会のビジネス街の景色と奇妙な対比をなしており、時間が止まったような浮遊感を味わえる。休日の賑わいとは裏腹に、平日の午前中などは乗り物だけが静かに動き続ける無人の光景に出会えることもある。', updated_at = now()
where slug = 'bRVna6ES' and md5(description) = '8ff56454ee0221b0fadf0f0e0a0b93e6';

-- 屋上遊園スカイランド（松坂屋高槻店）（bRVna6ES）
update public.spots set access = 'JR京都線 高槻駅から徒歩約2分、阪急京都線 高槻市駅から徒歩約6分。松坂屋高槻店の屋上（R階）にあり、店内エレベーターまたはエスカレーターで直接アクセス可能。', updated_at = now()
where slug = 'bRVna6ES' and md5(access) = '728e369bea62eba4f00fd502d418a052';

-- 旧摩耶観光ホテル（MgcgYpSc）
update public.spots set description = '「廃墟の女王」と呼ばれる、神戸・摩耶山中腹に佇む幻の洋館。1929年に開業した高級リゾートホテルで、かつては皇族や著名人も訪れる社交場として賑わったが、1967年の集中豪雨の被害でホテル営業を休止し、その後しばらく学生の合宿施設として使われたのち、1990年代から使われないまま残されている。緑に覆われた山中に忽然と現れる白亜の建物は、老朽化が進みながらも独特の風格を保っており、2021年には国の登録有形文化財にも登録された。廃墟でありながら文化財という矛盾した存在感が、時間の流れから切り離されたような不思議な浮遊感を生んでいる。現在は建物の崩落の危険があるため敷地内への立入は禁止されている。', updated_at = now()
where slug = 'MgcgYpSc' and md5(description) = 'dbbf4192e40e86215ca14e6e7954805f';

-- 旧摩耶観光ホテル（MgcgYpSc）
update public.spots set access = '神戸市バスまたは摩耶ケーブル・ロープウェーで摩耶山方面へ。摩耶ケーブル「虹の駅」から徒歩約15分、または摩耶自然観察園付近から山道を進む。建物自体は登録有形文化財だが老朽化のため普段は敷地内への立入は禁止されている。建物に近づけるのは、予約制の見学ツアーに参加したときのみ。', updated_at = now()
where slug = 'MgcgYpSc' and md5(access) = 'cc993e32bc54b290034f285d3c1dacda';

-- 東成田駅（旧成田空港駅）（FGg4w6Jh）
update public.spots set description = 'かつて成田空港（成田国際空港）の開港時にターミナル直結駅として使われていたが、1991年に現在の成田空港駅・空港第2ビル駅が開業したことで本線区間が使われなくなり、空港利用者の姿をほとんど見かけない駅となった。当時のままの案内看板や券売機、閉鎖された売店が時間が止まったように残されており、現役の駅でありながら廃墟のような静けさが漂う。地下通路の奥に伸びる薄暗いコンコースは、突然「8番出口」に迷い込んだかのような不思議な感覚を与える。', updated_at = now()
where slug = 'FGg4w6Jh' and md5(description) = '7e93fea10583177c159cb7db0502319a';

-- 東成田駅（旧成田空港駅）（FGg4w6Jh）
update public.spots set access = '京成本線・芝山鉄道 東成田駅下車すぐ。成田空港第2ビル駅とは約500mの地下連絡通路（利用は5:20〜23:15）でつながっており、そちらから徒歩でもアクセス可能。', updated_at = now()
where slug = 'FGg4w6Jh' and md5(access) = '8ac61e55f306282bb87d350402a1f022';

-- コインスナック ジョイフル24（nPuRMQQp）
update public.spots set description = '国道沿いにひっそりと佇む、24時間営業の無人の自動販売機コーナー。かつては軽食やジュース、雑貨まで揃う「コインスナック」として深夜のドライバーたちの休憩所になっていたが、今では多くの自販機が止まったまま、わずかな台数だけが稼働を続けている。蛍光灯だけが規則正しく点灯する誰もいない店内は、現実離れした均質な明るさに包まれており、深夜に訪れると「バックルームズ」を思わせる奇妙な浮遊感に包まれる。', updated_at = now()
where slug = 'nPuRMQQp' and md5(description) = '073a5cb2f26cc56e05c770cfe450b8fd';

-- 夕張市本町（廃墟街）（DmNxYTtA）
update public.spots set access = 'JR石勝線・夕張支線廃止後は路線バスでのアクセスとなる。夕鉄バス「本町4丁目・夕張市役所」下車すぐ。札幌市街から車で約1時間30分。', updated_at = now()
where slug = 'DmNxYTtA' and md5(access) = 'a3bb882168d6b8b67cd9f44151f30c19';

-- いよてつ高島屋 大観覧車くるりん（Ff8i4vwk）
update public.spots set access = '伊予鉄道松山市駅直結（JR松山駅からは路面電車で約10分）。いよてつ高島屋本館屋上（9階）に設置。', updated_at = now()
where slug = 'Ff8i4vwk' and md5(access) = '9f1895cf4e04c621bb5abf53d413fe80';

-- 清澄白河駅の不気味な通路（8番出口のモデル地）（vbUQ9kcZ）
update public.spots set description = '不規則に並んだ蛍光灯が印象的な地下通路で、パブリックアートとして意図的に不揃いに設置されているという。その独特の無機質な雰囲気から、世界的にヒットしたホラーゲーム『8番出口』の元ネタ・モデル地ではないかとSNS上で話題になった（作者は、通路そのもののモデルは別の駅だが、異変のひとつは清澄白河駅を参考にしたと説明している）。日常の駅構内でありながら、どこか閉塞感と反復感を漂わせる、リミナルスペースの代表例として知られる。', updated_at = now()
where slug = 'vbUQ9kcZ' and md5(description) = '0f8a82d7b869d13fc6bb3d45ea72ca55';

-- 清澄白河駅の不気味な通路（8番出口のモデル地）（vbUQ9kcZ）
update public.spots set access = '東京メトロ半蔵門線・都営大江戸線「清澄白河駅」構内。A3出入口付近の通路。', updated_at = now()
where slug = 'vbUQ9kcZ' and md5(access) = 'd9f77deb184c980ec075b848028b8c6e';

-- 東京駅 京葉線・武蔵野線連絡通路（渋すぎる入口）（KM5aKcco）
update public.spots set description = '1990年の京葉線開業時、もともと成田新幹線の駅として計画された、他の乗り場から大きく離れた地下深くの場所を京葉線が使うことになったために生まれた、東京駅の中でも異質な長い地下通路。白いタイル壁と黄色い注意テープ、場違いな理容室の看板が並び、まるで別世界のような雰囲気が漂う。利用者からは「ドラクエの隠しルートみたい」「東京駅とは思えない」との声が上がる、巨大ターミナル駅の中に潜む隠れた異空間。', updated_at = now()
where slug = 'KM5aKcco' and md5(description) = '1ded32b155e1731262d0aca936b8ab81';

-- 日光ウエスタン村（廃墟）（QxTyYMA9）
update public.spots set access = '東武鬼怒川線 新高徳駅から徒歩約10分。日光市栗原、国道121号（鬼怒バイパス）沿い。', updated_at = now()
where slug = 'QxTyYMA9' and md5(access) = '824277e2f9c555c3d877f8a22465b024';

-- 日光ウエスタン村（廃墟）（QxTyYMA9）
update public.spots set description = '1973年に開業し2006年に閉鎖された西部劇テーマの遊園地跡。かつての西部劇風の街並みがそのまま朽ち果てた状態で残されており、看板や建物の残骸が静かに時を刻んでいる。人の気配が完全に消えた「西部の町」の廃墟という強烈な非日常感が漂うリミナルスペース。', updated_at = now()
where slug = 'QxTyYMA9' and md5(description) = '6a2dc9934a0707336cbde0adefc671a3';

-- 熊ノ平駅跡（旧国鉄信越本線）（TcnQTVk5）
update public.spots set access = 'JR横川駅から遊歩道「アプトの道」を徒歩約2時間（片道約6km）（碓氷第三橋梁・碓氷峠鉄道文化むらを経由）。旧熊ノ平信号場跡として整備された遊歩道の終点付近に位置する。', updated_at = now()
where slug = 'TcnQTVk5' and md5(access) = '20fbc713ad00a87ca93a99a828dbdf2a';

-- タウシュベツ川橋梁（幻の橋）（BQQBELWM）
update public.spots set description = '旧国鉄士幌線の廃線橋。糠平湖のダム建設により水没する運命にありながら、季節ごとの水位変動で夏は湖底に沈み、冬から春にかけて再びその姿を現すことから「幻の橋」と呼ばれる。崩落が年々進み、いつ崩れ落ちてもおかしくない状態だがが、無人の湖面に浮かぶアーチ群と鏡のような水鏡が、失われゆく時間そのものを映し出しているようで見る者を圧倒する。', updated_at = now()
where slug = 'BQQBELWM' and md5(description) = '2106990eb6ee9f0bdc72ce703e8f4b4e';

-- タウシュベツ川橋梁（幻の橋）（BQQBELWM）
update public.spots set access = '国道273号沿いの駐車場から湖畔の「タウシュベツ川橋梁展望台」へ徒歩すぐ（対岸から望む）。橋のそばまで続く林道は一般車通行止めで、徒歩だと約4km・ヒグマ対策が必要なため、ガイドツアーの利用がおすすめ、事前に上士幌町観光協会のツアー情報を確認する必要がある。', updated_at = now()
where slug = 'BQQBELWM' and md5(access) = '215e871e741404fb2e5ce49433f5b20c';

-- 旧志免鉱業所竪坑櫓（ffbCQ6bM）
update public.spots set description = '旧海軍が炭鉱の坑口として建設した鉄筋コンクリート造の竪坑櫓。戦前に建てられた塔櫓巻き（ワインディングタワー）形式の竪坑櫓として国内で唯一、世界でも3基しか残っていない貴重なものでで、無骨なコンクリート塊が住宅街の中に唐突にそびえる異様な存在感を放つ。周囲は緑豊かな公園として整備され、日常の風景の中に軍事・産業遺産としての巨大な廃墟がぽつんと取り残されている対比が、独特の非現実感を漂わせる。', updated_at = now()
where slug = 'ffbCQ6bM' and md5(description) = 'c94b6f0980e67964227af74cb898a11f';

-- 旧志免鉱業所竪坑櫓（ffbCQ6bM）
update public.spots set access = 'JR香椎線 酒殿駅または須恵駅から徒歩15〜20分、西鉄バス「下志免」から徒歩約6分。志免町総合福祉施設シーメイト・なかよしパークに隣接し、周囲は公園として整備されている。', updated_at = now()
where slug = 'ffbCQ6bM' and md5(access) = 'de57e1d4aa77dfe65c374881f23e4b61';

-- 犬島精錬所跡（Ngoqp3Rw）
update public.spots set access = '岡山市の宝伝港から定期船で約10分、犬島港から徒歩約5分。遺構は犬島精錬所美術館の一部として見学できる（入館は有料）。', updated_at = now()
where slug = 'Ngoqp3Rw' and md5(access) = '4b7916632ec1792fc436acf3b6eecedb';

-- 首都圏外郭放水路(地下神殿)（JsXsWk9W）
update public.spots set description = '世界最大級の地下放水路。地下22mに広がる巨大な調圧水槽には高さ18m・重さ500トンの柱が59本林立し、その荘厳な光景から「地下神殿」と呼ばれる。国営洪水対策施設で、台風など大雨の際に周辺河川の水を江戸川へ排水する役割を担う。', updated_at = now()
where slug = 'JsXsWk9W' and md5(description) = 'c79efae2e169e04add141f4f237ff63d';

-- 大川グランドホテル(廃業)（9Gg5tgdq）
update public.spots set access = '伊豆急行線伊豆大川駅が最寄り。国道135号沿い、大川海岸を見下ろす高台に位置する。', updated_at = now()
where slug = '9Gg5tgdq' and md5(access) = 'f968367cb02c3d6e6ff2b83125445a39';

-- 白河高原スキー場(跡地)（RuCpHWym）
update public.spots set access = 'JR新白河駅から車で約30分。県道を経由した先、赤面山登山口の手前に位置する（跡地の駐車場入口は閉鎖されている）。', updated_at = now()
where slug = 'RuCpHWym' and md5(access) = 'ef891241b7ee6aae90a3d42e5c75b3ee';

-- 常紋トンネル（vHoKaWez）
update public.spots set description = '明治末から大正初期（1912〜1914年）にかけて、タコ部屋労働と多数の犠牲者を出した難工事の末に開通した石北本線の鉄道トンネル。人柱伝説が語り継がれ、1970年の改修工事では実際に壁の中から人骨が見つかっている。、今も深い山中でひっそりと口を開ける。雪に閉ざされた坑口をディーゼルカーが行き交う光景は、時代から取り残されたような静けさをたたえている。', updated_at = now()
where slug = 'vHoKaWez' and md5(description) = 'f7bd2a1bc31dc875a62c74015d9efbd7';

-- 松代大本営 象山地下壕（zphbsPDi）
update public.spots set access = 'JR長野駅善光寺口から「松代高校行き」バスで約30分、「松代八十二銀行前」下車、徒歩約20分。無料で内部の一部区間（約500メートル）が公開されており、ヘルメット貸し出しあり。', updated_at = now()
where slug = 'zphbsPDi' and md5(access) = 'fe9c974449d98e04eaefe14efe8f207b';

-- 大久野島発電場跡（ybWwuMCE）
update public.spots set description = '旧陸軍が大久野島に建設した発電施設の跡。戦後は使われないまま放置され、コンクリートの建屋だけが残された。現在はうさぎの島として知られる観光地の一角にありながら、蔦に覆われ朽ちた廃墟が異様な存在感を放ち、平和な島の風景と戦争の記憶が同居する不思議な空間となっている。', updated_at = now()
where slug = 'ybWwuMCE' and md5(description) = '8b2d9a206c43f5a2967c240f5fd7c05d';

-- 旧池島炭鉱 選炭工場跡（ZKgQrh3z）
update public.spots set description = 'かつて九州最後の炭鉱として稼働した海底炭鉱、池島炭鉱の選炭工場跡。平成13年の閉山後、施設はそのまま島に残され、錆びたトタン屋根や配管、水洗機などが海に面した斜面に折り重なるように広がる。空から見るとその複雑な構造がひとつの巨大な機械のように見え、時が止まった産業遺産としての異様な存在感を放つ。', updated_at = now()
where slug = 'ZKgQrh3z' and md5(description) = '054f27e56f48dc018bb4695df27f3da0';

-- 旧池島炭鉱 選炭工場跡（ZKgQrh3z）
update public.spots set access = '長崎県長崎市池島町。神浦港・瀬戸港（西海市）または佐世保港から船で池島港へ渡り、島内を徒歩または見学ツアーで移動する。内部は老朽化のため立入禁止。', updated_at = now()
where slug = 'ZKgQrh3z' and md5(access) = '916c9dc927b0bc189efd881a2edfc221';

-- 池島炭鉱住宅 17号棟（kLSQhNsf）
update public.spots set access = '長崎県長崎市池島町。神浦港・瀬戸港（西海市）または佐世保港から船で池島港へ渡る。港から徒歩圏内。炭鉱住宅群のため島内は坂と階段が多い。', updated_at = now()
where slug = 'kLSQhNsf' and md5(access) = 'dc7eb34b69f60fc1293912168e4d9c96';

-- 旧別子銅山 東平地区（C3r5rXkW）
update public.spots set description = '「東洋のマチュピチュ」と称される、別子銅山の中腹に広がる採鉱本部跡。大正から昭和初期にかけて採鉱本部が置かれ、1968年まで山の町として栄えたが、その後は無人となって山中に取り残され、貯鉱庫やインクラインなどの赤レンガ・石積みの遺構が急峻な斜面に折り重なる。深い霧に包まれた朝など、まるで南米の古代遺跡を思わせる幻想的な光景が広がる。', updated_at = now()
where slug = 'C3r5rXkW' and md5(description) = 'ff2be1a6bf7fa0cd8a4c5a8b422f8f1b';

-- しゃくなげ学校（旧鎌掛小学校）（NypNZ4hq）
update public.spots set description = '1930年に建てられ、2001年の閉校まで使われた旧鎌掛小学校の木造校舎。地域の保存活動により「しゃくなげ学校」として一般公開されており、色あせた緑の黒板や古い机、当時の教科書や資料がそのままの姿で残る教室に足を踏み入れると、時間が止まったかのような静けさに包まれる。木の廊下を踏む音だけが響く空間は、昭和の記憶を色濃く漂わせている。', updated_at = now()
where slug = 'NypNZ4hq' and md5(description) = '0cacc38daa66dbe13749d240d2217e17';

-- 笹間渡発電所（XroRJy6m）
update public.spots set description = '1928年（昭和3年）に着工し、1931年（昭和6年）に運転を始めた東海紙料（後の東海パルプ）の水力発電所跡。建設当時は鉄道が通じておらず、資材は船で運搬されたと伝わる。大井川の蛇行する流れに囲まれた対岸にひっそりと佇み、緑に包まれてゆっくりと朽ちていくその孤高の姿は、訪れる者を寄せ付けない静けさを湛えている。', updated_at = now()
where slug = 'XroRJy6m' and md5(description) = '1795a189dc79fb3dea357565181132a4';

-- 笹間渡発電所（XroRJy6m）
update public.spots set access = '静岡県島田市川根町笹間渡。大井川鐵道川根温泉笹間渡駅・地名駅が最寄り。大井川の対岸に位置し、直接の徒歩でのアクセスは困難。', updated_at = now()
where slug = 'XroRJy6m' and md5(access) = '5531735db2d52a611c5eddeee838226c';

-- 丸二ホテル伊勢の郷（TamekAJY）
update public.spots set description = '1985年開業、鉄骨9階建ての巨大な廃ホテル・老人ホーム。日本最大級ともいわれる現存不使用施設で、その圧倒的なスケールはまるで巨大な屏風が立ち塞がるかのよう。バブル期の栄華を今に伝える窓の数々は、割れたまま静かに外気にさらされ、館内には当時の設備や調度品が手つかずのまま眠っている。周囲の田園風景の中に忽然と現れるその威容は、訪れる者を圧倒する。', updated_at = now()
where slug = 'TamekAJY' and md5(description) = '7d97f770d5fd4649a32faf1c0fe18c10';

-- 国民宿舎むろと（zTqTM2wW）
update public.spots set description = '1971年、総工費1億2500万円をかけて開業した国民宿舎跡。当時の厚生省から「形がユニークで懲りすぎている」と認可を渋られたという逸話が残るほど個性的な円形の外観を持ち、木々の海に浮かぶように佇む姿が印象的。2005年に閉業して以降、室戸岬の豊かな緑にゆっくりと還りつつある。', updated_at = now()
where slug = 'zTqTM2wW' and md5(description) = '22c5c9bdce7cf071ddcfd749272bec43';

-- 亀崎海上ホテル（EBE4SgkG）
update public.spots set description = '1963年から1975年の間に開業したとされる、潮風吹きすさぶ岬の先端に建つ海上リゾートホテル跡。50名収容の客室に加え、岩風呂や300人規模の宴会場、モーターボートを備えたクルージングプランまで用意された贅を尽くした施設だった。忍者屋敷を思わせる複雑な構造やしゃれた丸窓など意匠にもこだわりが見られたが、遮るものない海風にさらされ続けた結果、外壁や窓ガラスの損傷が進行。今ではホテルへと続く路盤のコンクリートまでもが崩落し、波打ち際にひっそりと朽ちる姿をさらしている。', updated_at = now()
where slug = 'EBE4SgkG' and md5(description) = '0b319a2b80e8b462c208d5ff4a5dde0f';

-- ベルビュー富士ホテル（uaZDcbYY）
update public.spots set description = '1960年代後半に開業した結婚式場も備える大型リゾートホテルの廃墟。晴れた日には間近に富士山を望める高台に建ち、地上3階・地下1階の本館に加えて社員寮も残る。1990年代半ばに閉業したとみられ、2003年頃から廃墟として知られるようになった。窓や壁が失われた箇所も多く、朽ちた廊下や崩落した屋根に草木が茂り、かつての賑わいの気配だけが漂う静けさに包まれている。', updated_at = now()
where slug = 'uaZDcbYY' and md5(description) = 'fb59c090ea608baf8f5642529a4d811f';

-- 田村鉄工所（A9wovu3T）
update public.spots set description = '田村鉄工所は、秋田県大館市（旧・北秋田郡田代町）にある廃工場跡。明治期から続く鉄工所で、1905年に田村松助が家業の鉄工所を継ぎ、のちに合資会社（1935年）、田村鉄工株式会社（1944年）へと改組して東北有数の大工場に成長した。戦時中は魚雷や弾頭を製造し、当時の大館中学の勤労動員隊を引き入れていた。現存する洋館風の事務所建物は1940年頃に竣工。2001年10月頃に閉業した。2019年時点で2階建ての洋館風事務所跡に蔦が美しく這い、巨大な煙突跡も残る。かつてあった木造2階建ての工場建物は2012年頃に作業場部分が倒壊し、解体された。', updated_at = now()
where slug = 'A9wovu3T' and md5(description) = '531dcacd48b34332fb1f2f7a62b79560';

-- サンシャインシティ 展示ホールA（otDUUTkK）
update public.spots set description = '池袋・サンシャインシティのワールドインポートマートビル4階にある大型展示ホール。搬入出直後や開催前後の無人時間帯には、什器も来場者もいない広大な床面と、天井いっぱいに並ぶ均質な照明だけが残り、通路が果てしなく続くような感覚を生み出す。窓のない閉ざされた構造も相まって、バックルームズ的な空間性を指摘する声がSNSでもたびたび見られてきた。

この既視感が評価され、映画『バックルームズ』の日本公開を記念した体験型イベント「Q LIMINAL（クリミナル）」の会場にも選ばれている。2026年9月11日〜20日の会期中、ゲームや映画の中でしか味わえないはずの"どこまでも続く無人の展示室"を現実の空間で追体験できる場所として、リミナルスペース愛好者の間で静かに注目を集めている。

photo: Q LIMINAL', updated_at = now()
where slug = 'otDUUTkK' and md5(description) = 'c4fea4b19255477f10ba8615786a52f4';

-- 新陽ビル 2F（赤坂バックルームズ）（g5SSFruW）
update public.spots set description = '赤坂の一角、竣工から40年以上が経つ雑居ビルの2階。かつてオフィスとして使われ、空室のまま眠っていたガラス張りの一室が、2026年9月1日〜13日の期間限定で、夜になると黄色い光を灯していた。積み上げられた古い家具、意味を失った什器、どこまでも均質な壁——映画『バックルームズ』の象徴的な一場面をそのまま切り取ったような光景が、街灯の少ない路地に忽然と浮かび上がる。

これは同作の日本公開を記念してクリエイティブチーム・PINPIN STUDIOが手がけた実物大の"リアル3D広告"で、リユース市場から集めたジャンク品を積み上げ、劇中の空間をそのまま再現したもの。ガラス面自体をディスプレイに見立てた仕掛けにより、通りすがりの人の目には本物の異空間が現実に出現したかのように映り、目撃投稿はSNSで瞬く間に拡散した。

中に入ることはできず、外から覗き込むことしかできない。その"覗き見"の距離感こそが、境界の向こう側を一方的に眺めているようなリミナルな感覚を、かえって強めている。', updated_at = now()
where slug = 'g5SSFruW' and md5(description) = '053904a297868e616194b8753ef2ff97';

-- トレド駅（Toledo）（GGaTzjiy）
update public.spots set description = 'トレド駅（Toledo）はイタリア・ナポリの地下鉄駅。ナポリ地下鉄1号線に属し、2012年9月に旅客営業を開始した。設計はスペインの建築家オスカル・トゥスケツ（Óscar Tusquets）。現代美術家を起用して駅そのものを作品化するナポリの「芸術の駅（Stazioni dell’Arte）」計画の中核をなす駅で、地表から地下深くへ円錐状に貫く吹き抜け「光のクレーター（Crater de Luz）」の内壁は青いモザイクで覆われ、ロバート・ウィルソンによるLED照明作品「Relative Light」が光を添えている。海面下へ潜っていく感覚を意図した青のグラデーションの中を長大なエスカレーターがひたすら下降していく構成で、乗客の途切れた時間帯には人工の深海に取り残されたような感覚が残る。コンコース階にはウィリアム・ケントリッジによる巨大モザイク壁画があり、モンテカルヴァーリオ側へは約170メートルの連絡通路が延びている。2013年にエミレーツLEAF賞の年間最優秀公共建築、2015年に国際トンネル協会賞を受賞し、英デイリー・テレグラフ紙などから「ヨーロッパで最も美しい地下鉄駅」と評された。', updated_at = now()
where slug = 'GGaTzjiy' and md5(description) = 'c251050a8284a10aecd4e131a219f5e4';

-- オヘア空港ターミナル1 地下連絡通路「The Sky’s the Limit」（BZHyPP3o）
update public.spots set description = 'シカゴ・オヘア国際空港ターミナル1の地下連絡通路は、ユナイテッド航空のBコンコースとCコンコースを地下で結ぶ動く歩道の通路。ターミナル1はヘルムート・ヤーン（Helmut Jahn）の設計により1987年に開業し、この通路には同年、美術家マイケル・ヘイデン（Michael Hayden）による光のインスタレーション「The Sky’s the Limit」が設置された。湾曲した天井に沿って波打つように配されたネオン管がコンピュータ制御で色を変えながら流れ、ガーシュウィン「ラプソディ・イン・ブルー」を編曲した音楽が低く流れ続ける。両側の壁面は波打つように光るパネルで覆われ、刻々と移り変わる色光に包まれながら動く歩道に運ばれていく体験は、移動のためだけに存在する空間を抽象化したような感覚をもたらす。深夜や早朝、乗り継ぎ客が途切れた時間帯には人影のない光のトンネルだけが残り、空港建築におけるリミナルスペースの象徴としてしばしば取り上げられる。', updated_at = now()
where slug = 'BZHyPP3o' and md5(description) = '6b93fc549a1efbd3949302535d3e930c';

-- 旧エルベトンネル（Alter Elbtunnel）（sjnJteVJ）
update public.spots set description = '旧エルベトンネル（Alter Elbtunnel、正式名称St. Pauli Elbtunnel）はドイツ・ハンブルクのエルベ川の下をくぐるトンネル。かつては自動車も通れたが、2019年以降は歩行者・自転車専用となっている。1911年9月7日開通で、全長約426メートル、水面下約24メートルを通る。南北の円形の縦坑（シャフト）に設けられた大型エレベーターで人も自動車もまるごと地下へ降ろし、そこから2本の並行するチューブが対岸まで延びるという構成で、開通当時は技術的偉業とされた。内壁は白い陶製タイルで覆われ、漁や船にまつわる装飾タイルが要所に埋め込まれている。アーチ状の断面が延々と反復し、消失点へ吸い込まれるように続く光景は、いかにも移行空間らしい非現実感を持つ。現在も現役で使われているが、観光客や通勤客が途切れる時間帯には、100年以上前のタイル張りの管の中に自分ひとりだけが残される。', updated_at = now()
where slug = 'sjnJteVJ' and md5(description) = '4b68a61be0aab81251a37a2ad7561201';

-- ポンテ・シティ 中央吹き抜け（Ponte City）（SxcZ69LR）
update public.spots set description = 'ポンテ・シティ（Ponte City）は南アフリカ・ヨハネスブルグにある円筒形の超高層集合住宅。1975年竣工、54階建て・高さ約173メートルで、竣工から半世紀近くにわたってアフリカ大陸で最も高い住宅建築だった。最大の特徴は建物の中心を貫く円形の吹き抜けで、全戸に採光を確保するために設けられたこの「コア」は、地上から空まで筒状に抜けている。アパルトヘイト末期から1990年代にかけて建物は荒廃し、コアの底には数階分の高さまで瓦礫やゴミが堆積した。その後清掃と再生が進み、現在は管理された住宅として使われている。底から見上げても上から見下ろしても、同じ窓の列が延々と円を描いて続くだけで遠近感が壊れる。都市の内部に垂直に穿たれた空洞という、他にほとんど例のない空間である。', updated_at = now()
where slug = 'SxcZ69LR' and md5(description) = '6ea598c0bee179ded361ad7304eeb144';

-- ヌオーヴォ・コルヴィアーレ（Nuovo Corviale）（odS8ze5z）
update public.spots set description = 'ヌオーヴォ・コルヴィアーレ（Nuovo Corviale）はイタリア・ローマ西郊に建つ公営集合住宅。建築家マリオ・フィオレンティーノ（Mario Fiorentino）率いるチームが1972年から設計し、1975年に着工、1982年から入居が始まった。全長約958メートル、幅約200メートル、高さ約30メートル、地上9階建てに約1200戸を収容する一棟の建物で、「イル・セルペントーネ（大蛇）」「パラッツォ・キロメトロ（1キロの建物）」の通称で知られる。ル・コルビュジエのユニテ・ダビタシオンの思想を極限まで押し進め、住宅・商店・公共サービスをすべて1本の建物に収める構想だったが、中層階に予定されていた商業・公共施設は完成せず、長く未完のまま放置された。同じ窓、同じ廊下、同じ階段室が1キロにわたり寸分違わず反復する内部は、位置を示す手がかりが乏しく、どこまで歩いても同じ場所に見える。ローマの郊外に横たわる巨大な水平線そのものである。', updated_at = now()
where slug = 'odS8ze5z' and md5(description) = 'e299006834ca82b5e656e3f9c22cb3f0';

-- ジェネクス・タワー／西の門（Genex Tower）（UdwmdZmu）
update public.spots set description = 'ジェネクス・タワー（Genex Tower）は旧ユーゴスラビア時代のセルビア・ベオグラードに建てられた高層建築で、正式には「ベオグラードの西の門（Zapadna kapija Beograda）」と呼ばれる。建築家ミハイロ・ミトロヴィッチ（Mihajlo Mitrović）の設計により1980年に完成した。オフィス棟と住宅棟の2本の塔が二層の空中ブリッジで結ばれ、頂部には回転レストランを載せた「門」の形をしている。高さは約115メートル。空港から市内へ向かう幹線道路の脇に立ち、西から街に入る人を迎える門として、都市への入口を演出する装置として設計された。頂部のレストランは床の回転機構が一度も動かないまま営業を終えて閉ざされ、オフィス棟も長く空室が続いている。粗いコンクリートの塊が空に向かって左右対称に立ち上がる姿は、機能を失ってなお都市の入口を示し続ける記念碑のようで、社会主義時代の未来像がそのまま凍結された空間になっている。', updated_at = now()
where slug = 'UdwmdZmu' and md5(description) = '5c653e685d20c7083cde57ab30732775';

-- ジェネクス・タワー／西の門（Genex Tower）（UdwmdZmu）
update public.spots set access = 'セルビア・ベオグラード、新ベオグラード地区（Novi Beograd）。ニコラ・テスラ空港から市中心部へ向かう幹線道路沿いに立ち、空港から市内へ向かう車窓から正面に見える。オフィス棟内部は非公開。', updated_at = now()
where slug = 'UdwmdZmu' and md5(access) = '4dc57c279339dde49d6c14726d41b9d4';

-- プレストン・バスステーション（Preston Bus Station）（VE2WnRAp）
update public.spots set description = 'プレストン・バスステーション（Preston Bus Station）はイギリス北西部ランカシャー州プレストンにあるバスターミナル。1969年10月の開業で、設計はビルディング・デザイン・パートナーシップ（BDP）のキース・インガムとチャールズ・ウィルソン、構造はオヴ・アラップ。開業当時ヨーロッパ最大級のバスターミナルとされ、南北両側に合わせて80のバス発着バース、上層には1000台以上を収容する立体駐車場を備える。外観を特徴づけるのは、駐車階の縁を包む白いコンクリートの曲面パラペットで、これが上下に何層も反復して水平線を作り出す。何度も解体案が持ち上がったが2013年にグレードIIの指定建造物となり、営業を続けながら改修が進められ、2018年に完了した。ターミナル内部は左右対称で果てしなく長い待合コンコースになっており、バスの発着が途切れる時間帯には、同じベンチと同じ扉が並ぶだけの静かな空間になる。', updated_at = now()
where slug = 'VE2WnRAp' and md5(description) = 'ef0596e3d340a00620bcb5d47a98f581';

-- 芸術科学都市（Ciutat de les Arts i les Ciències）（HTpfFcWy）
update public.spots set description = '芸術科学都市（Ciutat de les Arts i les Ciències）はスペイン・バレンシアにある複合文化施設群。1957年の大洪水を受けて流路を変更した旧トゥリア川の河床跡に、大部分を地元バレンシア出身の建築家サンティアゴ・カラトラバが設計し（水族館「オセアノグラフィック」はフェリックス・キャンデラ）、1996年の着工後、1998年から2009年にかけて順に開館した。目の形をしたプラネタリウム「エミスフェリック」、クジラの骨格のような科学博物館、アーチの並ぶ遊歩道「ウンブラクレ」、オペラハウス「芸術宮殿」などが、細長い敷地に一列に並ぶ。すべてが白いトレンカディス（砕いたタイル）で覆われ、その間を浅い水盤と広大な舗装面が埋める。建物と建物の距離が極端に離れているため、来場者がいても人影はまばらにしか見えず、白い骨格と水面の反射だけが視界を占める。夜間、照明だけが灯る無人の水盤沿いを歩くと、地上に作られた別の惑星のような感覚になる。', updated_at = now()
where slug = 'HTpfFcWy' and md5(description) = 'f26467b399d5ba3423017374fc67a900';

-- ヴァスコンセロス図書館（Biblioteca Vasconcelos）（wS95uPD7）
update public.spots set access = 'メキシコ・メキシコシティ、クアウテモック区ブエナビスタ。地下鉄B線 Buenavista 駅すぐ（メトロブス1号線・近郊鉄道 Tren Suburbano も接続）。入館無料で一般公開されている。', updated_at = now()
where slug = 'wS95uPD7' and md5(access) = '7f0515ac78d73d3b8f2d77e998af1d8e';

-- ムゼウムスインゼル駅（U-Bahnhof Museumsinsel）星空のホーム（rvEs5gKL）
update public.spots set description = '2021年に開業したベルリン最新の地下駅。シュプレー川の真下を凍結工法で掘り抜いたトンネルの天井いっぱいに、深い群青の膜と6662個の光点が広がる。シンケルが描いた『魔笛』の夜の女王の舞台美術を下敷きにした意匠で、地下約16mの閉じた筒の中に人工の夜空だけが浮かんでいる。列車が去ると、黄色い車体の残像と一緒に音が消え、星の下に自分の足音だけが残る。地上には世界中の観光客がいるのに、この深さまで降りてくる人は少なく、ホームはしばしば無人になる。移動のための通過点が、どこにも属さない夜へ置き換わってしまったような一角。', updated_at = now()
where slug = 'rvEs5gKL' and md5(description) = '34e5f1f2a75af55f617b0c5f0f31f169';

-- コスモナフトラル駅（Kosmonavtlar / Космонавтлар）（aMYSkmHZ）
update public.spots set access = 'タシケント地下鉄ウズベキスタン線（2号線）「Kosmonavtlar」駅。ナヴォイ劇場やアリシェル・ナヴォイ通りから徒歩圏。2018年まで撮影禁止だったが現在は解禁されている。', updated_at = now()
where slug = 'aMYSkmHZ' and md5(access) = 'c532bb40eeda30e50d3d85fba6841842';

-- ブルジュ・アル・ババス（Burj Al Babas）城の谷（ETbKd2jH）
update public.spots set description = '2014年に着工し、2018年に開発会社が経営破綻し、工事が止まったままの高級ヴィラ群。同じ設計の小さな城が587棟、丘の斜面に等間隔で並んでいる。尖塔、出窓、灰色の円錐屋根——どれも寸分違わず同じで、どの一棟の前に立っても風景が反復し、自分がどの通りにいるのか特定できなくなる。窓ガラスはなく、内部はコンクリートの躯体が剥き出しのまま。谷筋を風が抜けると、数百の空洞が同時に低く鳴る。誰も住んだことがないのに、確かに「街」の形だけが完成している。生活が一度も始まらないまま終わってしまった住宅地という、極端な形のリミナルスペース。', updated_at = now()
where slug = 'ETbKd2jH' and md5(description) = '942d0a140b5e91c164cf2cb24c13ecda';

-- メウゼバンカー／ネズミの要塞（Mäusebunker）（zEybC8RS）
update public.spots set access = 'ドイツ・ベルリン南西部シュテーグリッツ＝ツェーレンドルフ区リヒターフェルデ、クラーマー通り（Krahmerstraße）。Sバーン Botanischer Garten 駅または Lichterfelde Ost 駅から徒歩。内部は非公開で、外観のみ見学できる。', updated_at = now()
where slug = 'zEybC8RS' and md5(access) = '7fd2a2e74cd9220d1dcccc1c7c66b324';

-- 勵德邨（Lai Tak Tsuen）円筒形住棟の内側（z2qWaUEB）
update public.spots set description = '1976年に完成した香港唯一の円筒形公共住宅。中庭を囲んで円環状に廊下が巡り、真上を見上げると洗濯物と空調室外機の連なりが同心円を描いて天空へ吸い込まれていく。内側に立つと、どの方向を向いても同じ形の扉と手すりが繰り返され、自分が何階のどこにいるのかが急に分からなくなる。数千人が暮らしているはずなのに、昼下がりの回廊はたいてい無人で、換気口を抜ける風の音だけが円筒の内壁に反響する。上階と下階の区別が意味を失い、ただ「内側」と「外側」だけが残る——移動のための構造がそのまま閉じた世界になってしまった、香港でもっとも純度の高いリミナルスペースのひとつ。', updated_at = now()
where slug = 'z2qWaUEB' and md5(description) = '918f24056a899b8cd9a575c9377ca449';

-- 勵德邨（Lai Tak Tsuen）円筒形住棟の内側（z2qWaUEB）
update public.spots set access = '香港MTR港島線「天后」駅または「銅鑼灣」駅から徒歩約15分、勵德邨道を上る。バスは11・23B・26系統などが団地前に停車。敷地内は居住区のため通り抜けは可能だが静穏に。', updated_at = now()
where slug = 'z2qWaUEB' and md5(access) = 'b4ca24546212b16941cf2193b85cb2e1';

-- 世運商街（세운상가 / Sewoon Sangga）空中歩廊（eZkorbK7）
update public.spots set description = '1968年に完成した韓国初の住商複合メガストラクチャー。全長約1kmにわたり、完成時には8つ（現在は7つ）の棟が数珠つなぎになり、3階レベルを「空中歩廊」が貫いている（ソウル市は2026年から歩廊の撤去を進める計画を示している）。かつては電子部品を求める人で埋まっていた通路も、龍山への商圏移動のあと日中でも人影がまばらで、シャッターの下りた区画と、まだ灯りのついた小さな工房が交互に並ぶ。頭上には低い天井、足元にはくすんだタイル、両側には同じ幅の開口が延々と続き、歩いているうちに何棟目にいるのか分からなくなる。都市の上に架けられたもうひとつの地面——通行のためだけに存在するはずの床が、そのまま滞留の場所になってしまった空間。', updated_at = now()
where slug = 'eZkorbK7' and md5(description) = 'a84d386ccfc76f1a06d0cb3212479b2c';

-- ヌルジョル大通り（Nurzhol Blvd）アスタナ新都心軸（5uoQXuQ8）
update public.spots set access = 'カザフスタン・アスタナ市左岸地区。国際空港から車で約25分。市バス10・18・37系統などが大通り沿いに停車する。全長約3kmの歩行者軸で、東端の大統領官邸アクオルダから、中央のバイテレクを経て西端のハン・シャティルまで徒歩約40分。冬季は氷点下30度近くまで下がる。', updated_at = now()
where slug = '5uoQXuQ8' and md5(access) = '99867c6632996b2eebdf73a01cd24c62';

-- アントワープ中央駅（Antwerpen-Centraal）大階段と地下ホーム（bhAnQa6U）
update public.spots set description = '1905年完成の石造の大伽藍のような駅舎に、2007年に完成した改築で地下に2層のホームが増設され、駅は4層構造になった。ドーム下の大階段からのぞき込むと、床が抜けたように何層も下までホームが重なり、いちばん下の線路は地下約18mを走っている。装飾過剰な19世紀の天蓋と、剥き出しのコンクリートの吹き抜けが同じ視界に同居していて、時代の接続がうまく噛み合わないまま宙づりになっている。列車の合間、大理石の広間に人が途切れると、高い天井の反響だけが残る。到着とも出発ともつかない場所で、上へ下へ人が沈んでいく縦方向の乗り換え空間。', updated_at = now()
where slug = 'bhAnQa6U' and md5(description) = '9e1cdfb914f3c8711182f3aa4c3871f7';

-- イタリア文明宮／四角いコロッセオ（Palazzo della Civiltà Italiana, EUR）（H3TU5VjM）
update public.spots set access = 'ローマ地下鉄B線「EUR Magliana」駅または「EUR Palasport」駅から徒歩約10分。テルミニ駅から約20分。建物の外周アーケードは常時歩けるが、内部はフェンディの本社として使われており、1階で企画展が開かれる時期以外は非公開。', updated_at = now()
where slug = 'H3TU5VjM' and md5(access) = '13338e3bacc67c165be1ea850fe977e7';

-- ハビタ67（Habitat 67）空中の路地（nAxdFr63）
update public.spots set access = 'カナダ・モントリオール、サンローラン川沿いのシテ・デュ・アーヴル半島。地下鉄オレンジ線「Square-Victoria-OACI」駅から徒歩約25分、旧港からBIXI（自転車）で約10分。敷地内は私有の集合住宅。一般の人が中に入れるのは公式のガイドツアーのときだけで、それ以外は外周の遊歩道から眺める。', updated_at = now()
where slug = 'nAxdFr63' and md5(access) = 'c1095c71ff1cb061d3261d37791b2f72';

-- ムーステク駅（Můstek）アルミ製の壁面（vAGShZq4）
update public.spots set description = '1978年開業。プラハ地下鉄A線の各駅は、陽極酸化アルミのパネルで壁一面が覆われている。丸く凹んだものと平らなものが規則的に並び、駅ごとに金・銀・緑・赤と色だけが違う。凹みの底が周囲の光を拾って鈍く光るので、壁全体が均質なテクスチャーになり、どこを見ても焦点が結ばない。社会主義時代の国営デザインが、駅名の表示以外のすべての情報を削ぎ落とした結果、ホームは「どの駅でもありうる場所」になった。列車が去った直後、この壁の前に立つと、自分がプラハのどこにいるのかという手がかりが一瞬だけ消える。', updated_at = now()
where slug = 'vAGShZq4' and md5(description) = 'c1a6d1a01fd59a2ca2b439de6e87bdb7';

-- ムーステク駅（Můstek）アルミ製の壁面（vAGShZq4）
update public.spots set access = 'プラハ地下鉄A線・B線「Můstek」駅。ヴァーツラフ広場の北端と旧市街を結ぶ乗換駅で、地上出口はいずれも繁華街の中。同じ意匠の壁面はNáměstí Míru駅、Staroměstská駅などA線の各駅でも見られる。', updated_at = now()
where slug = 'vAGShZq4' and md5(access) = 'ecbe03236d1a31eab8743638d76bea1c';

-- ミニョカン／ジョアン・グラール大統領高架路（Minhocão, Elevado Pres. João Goulart）（KewaKgjE）
update public.spots set description = '1971年に開通した全長約3.4kmの高架道路。窓の目の前を高架が走る形で住宅街の上に架けられ、集合住宅のベランダと路面の距離は数メートルしかない。車が通る時間帯はただの騒がしい高速路だが、平日の夜20時以降と週末に通行止めになると、片側2車線のアスファルトが突然「何もない広い床」に変わる。白線とアスファルトの継ぎ目だけが延々と続き、車のためのスケールで作られた空間に人がぽつぽつと立っている。道路でも公園でもなく、その二つの状態を毎日行き来している——時間によって用途が入れ替わるという、めずらしいかたちのリミナルスペース。', updated_at = now()
where slug = 'KewaKgjE' and md5(description) = '659dd8f5451595bb139e998af6be23b1';

-- ミニョカン／ジョアン・グラール大統領高架路（Minhocão, Elevado Pres. João Goulart）（KewaKgjE）
update public.spots set access = 'ブラジル・サンパウロ中心部。地下鉄3号線（赤）・4号線（黄）「República」駅、または3号線「Santa Cecília」駅から徒歩約5〜10分。平日20時以降と土日・祝日は終日、車両通行止めになり歩行者に開放される。夜間の周辺は治安に注意。', updated_at = now()
where slug = 'KewaKgjE' and md5(access) = '4f7c9d246a5875225f3bc55307b836df';

-- レッジョ・エミリア AV メディオパダーナ駅（Reggio Emilia AV Mediopadana）（yZFZrRtZ）
update public.spots set description = '2013年開業、サンティアゴ・カラトラバ設計の高速鉄道駅。13種類の白い鋼鉄フレームが25回繰り返されて483mにわたって波打ち、そのすべてが少しずつ角度を変えながら同じ形を繰り返している。駅の周囲は畑と高速道路のジャンクションで、街はここから数km離れている。列車が停まるのは1時間に数本、乗り降りするのは十数人。停車と停車のあいだ、白いリブの下には巨大な空間だけが残り、風が通り抜ける音がする。都市の玄関として設計されながら、その玄関の外側に都市がない——通過するためだけに存在する、平野に浮かんだ白い骨格。', updated_at = now()
where slug = 'yZFZrRtZ' and md5(description) = '6d876f923dc6c879bf31ed3d3a20b590';

-- ユニテ・ダビタシオン／シテ・ラディウズ（Unité d’Habitation, Cité Radieuse）内部通り（bqxwzKhM）
update public.spots set access = 'フランス・マルセイユ8区、ミシュレ大通り280番地。地下鉄2号線「Rond-Point du Prado」駅からバス21・22番で約10分。1階のピロティと屋上テラス、7・8階の商店街とホテルの階は一般に開放されており、住戸階の廊下は居住者専用。', updated_at = now()
where slug = 'bqxwzKhM' and md5(access) = '5360ac1249bd007d99e04bc470fbc557';

-- アール・エ・メティエ駅 11号線ホーム（Arts et Métiers）（ZoeUqjtb）
update public.spots set description = '1994年、隣接する工芸博物館の母体・国立工芸院の創立200年に合わせて改装されたホーム。壁も天井も銅板で覆われ、無数のリベットが打たれ、側壁には丸い舷窓が等間隔に並ぶ。頭上には用途の分からない巨大な歯車が回らないまま固定されている。ジュール・ヴェルヌのノーチラス号の内部を模した設計で、照明は黄色く落とされ、銅の表面が鈍く反射する。列車が去ったあと、この筒の中に一人で残されると、地下鉄のホームというより「どこかへ潜航している船の中」に紛れ込んだような感覚になる。日常の乗り換えのための場所が、まったく別の時代と媒質に置き換わってしまう数分間。', updated_at = now()
where slug = 'ZoeUqjtb' and md5(description) = 'e3f87c2f2e9ea9af0a32171ff4db4515';

-- ワルデン7（Walden 7）内部の吹き抜け（aGkQCYCw）
update public.spots set description = '1975年完成。ル・コルビュジエ流の理想都市に対するリカルド・ボフィルの回答として、旧セメント工場の隣に積み上げられた446戸の集合住宅。内部には建物の高さいっぱいの吹き抜けが7つ空いていて、そこに橋のような通路が何層も渡されている。外壁は赤褐色、吹き抜けの内壁は濃紺のタイル。見上げると同じ形のバルコニーが遠近法の中に吸い込まれ、見下ろすと同じ通路が階下へ続く。真昼でも底には光が届かず、住人の生活音だけが上から降ってくる。「街をそのまま垂直に折り畳む」という実験の結果、建物の内部に、外でも内でもない路地だけが残った。', updated_at = now()
where slug = 'aGkQCYCw' and md5(description) = 'cb1e858d92201920a763adf2dc4240c5';

-- ワルデン7（Walden 7）内部の吹き抜け（aGkQCYCw）
update public.spots set access = 'スペイン・バルセロナ近郊サン・ジュスト・デスベルン。バルセロナ市街からトラム（Trambaix）T3線で「Walden」停留所下車すぐ。私有の集合住宅のため内部は居住者以外立入不可。隣接する「La Fábrica」（ボフィルの旧事務所）も同じ敷地の並びにある。', updated_at = now()
where slug = 'aGkQCYCw' and md5(access) = 'f088776d2c3f61480e76e877fbae7d24';

-- 平壌地下鉄 復興駅（부흥역 / Puhŭng）（oERyKFTJ）
update public.spots set access = '朝鮮民主主義人民共和国・平壌市、千里馬線「復興」駅。個人での訪問はできず、認可された旅行社のツアーに組み込まれた区間乗車のみ。かつて外国人が案内されたのは復興駅〜栄光駅の一区間だけだったが、2014年以降は全駅が開放された。ただしコロナ禍以降、観光客の乗車は停止されている。', updated_at = now()
where slug = 'oERyKFTJ' and md5(access) = '0c8fa220f126c2f8d06bd34ab3dcb154';

-- 柳京ホテル（류경호텔 / Ryugyong Hotel）（5VJb3WDb）
update public.spots set description = '1987年着工、105階・高さ330mの三角錐。1992年に外郭が完成した直後に資金が尽き、二十年近くコンクリートのまま放置された。2011年にガラス外装が張られ、近年は夜になると外壁の一面がLEDのアニメーションで光る。それでも内部は一度も仕上げられておらず、客室も廊下もエレベーターも空のまま、都市のどこからでも見える位置に立ち続けている。外側だけが完成し、中身が存在しない建物。街の高さの基準になりながら、ごく一部の人しかその中に入ったことがない——見えるのに到達できないという意味で、視界そのものがリミナルになる場所。', updated_at = now()
where slug = '5VJb3WDb' and md5(description) = '85ad525e269d853c028d79c462c27f33';

-- トロピカル・アイランズ／旧エアリウム飛行船格納庫（Tropical Islands, ex-Aerium）（EQ4XUbmu）
update public.spots set description = '長さ360m、幅210m、高さ107m。大型貨物飛行船CL160を製造するために1999〜2000年に建てられた世界最大級の自立式ドームで、計画が破綻したあと、2004年に人工の熱帯リゾートへ転用された。内部には砂浜、ラグーン、ヤシの木、熱帯雨林、気球まであるが、そのすべてが鋼のリブに支えられた一枚の膜の下に収まっている。ドームの一部は透明な膜で本物の空が透けて見えるが、風はエアコンの風、雨は降らない。ドームの隅に立って見上げると、リゾートの装置が終わったところから、もとの格納庫の巨大な空洞がそのまま続いている。外の気温が氷点下でも館内は常時26度——季節も天候も時刻も届かない、地上に置かれた閉じた気候。', updated_at = now()
where slug = 'EQ4XUbmu' and md5(description) = '36e67f178f5670831550ffae3ed5d767';

-- 南山邨（Nam Shan Estate）階段と中庭（A74rJrvL）
update public.spots set access = '香港MTR観塘線「石硤尾」駅B2出口から徒歩約10分、大坑東道沿いの丘の上。敷地内は居住区で通り抜け自由だが、早朝や夜間は生活音に配慮を。名物の点心店が団地の1階に入っている。', updated_at = now()
where slug = 'A74rJrvL' and md5(access) = 'a8523e3adba48e16031ceee47b799e63';

-- ピラミーデン（Пирамида / Pyramiden）（GLu6uDS2）
update public.spots set description = '北緯78度、スウェーデンが開き、1927年にソ連が買い取って石炭採掘のために整備した計画都市。文化宮殿、体育館、温室、グランドピアノのあるホール、世界最北のレーニン像——約1000人分の生活設備が一式そろっていたが、1998年に採掘が打ち切られ、住民は数か月で全員が去った。極北の乾いた寒気のおかげで腐敗がほとんど進まず、体育館にはバスケットボールが、教室には黒板の文字が、部屋には家具がそのまま残っている。夏は白夜で影が動かず、冬は数か月太陽が昇らない。時間が止まっているのではなく、時間の目盛りそのものが外の世界と違ってしまった町。', updated_at = now()
where slug = 'GLu6uDS2' and md5(description) = '0cd447e0510fdb74d22ec472615259a8';

-- ブズルジャ記念館（Buzludzha Monument）（TivYALh3）
update public.spots set access = 'ブルガリア中部、バルカン山脈のブズルジャ峰（標高約1432m）山頂。カザンラク市街から車で約40分、シプカ峠経由。冬季は積雪で道路が閉鎖されることがある。内部は封鎖されており立入禁止、外周からの見学のみ。', updated_at = now()
where slug = 'TivYALh3' and md5(access) = '67b9b94a63f9fb29f1ebb07bdf20f7cd';

-- ナポリ・アフラゴーラ駅（Stazione di Napoli Afragola）（Dio8uQN2）
update public.spots set description = '2017年開業、ザハ・ハディド設計の高速鉄道駅。7本の線路をまたぐ長さ450mの白い橋そのものが駅舎になっていて、中は骨のようなリブが連続する曲面の回廊になっている。窓の外はヴェスヴィオ山と畑と高速道路で、街はここから数km離れている。「ナポリの新しい玄関」と呼ばれながら市街とのアクセスが弱く、日中でもコンコースは広さに対して人がまばら。曲面に沿って視線が滑り、直線的な手がかりがないため、どこまで歩いたのかが分からなくなる。通過のためだけに設計された、風景から切り離された白い橋。', updated_at = now()
where slug = 'Dio8uQN2' and md5(description) = '5a62464c4b3f9f66dfe1fc8459bc4bfd';

-- ナポリ・アフラゴーラ駅（Stazione di Napoli Afragola）（Dio8uQN2）
update public.spots set access = 'イタリア・カンパニア州、ナポリ北郊のアフラゴーラ。ローマからは高速列車で約1時間。駅周辺は農地と高速道路で、アフラゴーラの旧市街までは約1km。', updated_at = now()
where slug = 'Dio8uQN2' and md5(access) = '6ed6cd17b36ac455b25158672179e405';

-- パノラミコ・デ・モンサント（Panorâmico de Monsanto）（GhMXEj8q）
update public.spots set description = '1968年、市街を見下ろす丘の上に開業した円形の高級展望レストラン。ガラス張りの客席がゆるやかに弧を描き、リスボンの屋根と川をそのまま額縁に収める設計だった。レストランのあとはディスコやビンゴ場、倉庫へと用途を変え、2001年に閉鎖されて放置された。2017年に展望台として一度開放されたが、2023年から再び閉ざされている。いまは壁一面がグラフィティで覆われ、割れたガラスの向こうに当時と同じ眺めが広がっている。かつて人々が着飾って食事をした場所に、いまは風とスプレーの匂いだけがある。見晴らしのための建物が、見晴らしだけを残して機能を失った、リスボンでもっとも静かな展望台。', updated_at = now()
where slug = 'GhMXEj8q' and md5(description) = 'd6f98ed18e84fe0d1bb7100337718289';

-- ウンベルストーン硝石工場町（Oficina Salitrera Humberstone）（9aLUxoT8）
update public.spots set description = '19世紀末から20世紀前半、チリの硝石産業を支えた工場町のひとつ。学校、劇場、ホテル、市場、そして鋼鉄製のプールまでを備えた、最盛期3700人ほどの町だったが、化学合成肥料の普及で硝石の需要が消え、1960年に閉鎖された。以後、雨のほとんど降らない砂漠の乾燥が建物を保存し、木造の劇場の座席も、プールの階段も、学校の黒板もそのまま残っている。屋根の抜けた講堂に砂が薄く積もり、風が金属板を鳴らす。産業がなくなった瞬間に人の生活だけが抜き取られ、器としての街が六十年以上そのまま置かれている。', updated_at = now()
where slug = '9aLUxoT8' and md5(description) = '07fff8664b1653c02ecef31822311357';

-- ビジャ・エペクエン（Villa Epecuén）（Mvs56E7i）
update public.spots set description = '1920年代、塩湖エペクエンのほとりに開かれた湯治とリゾートの町。最盛期には1500人ほどが暮らし、夏のあいだに2万5千人が訪れていた。1985年、堤防の決壊で湖水があふれ、町は最大10mの塩水の下に沈む。25年後に水が引くと、塩に漬かった建物の骨組みだけが白く残っていた。壁は塩で覆われて白骨のようになり、街路樹は枯れたまま立ち、通りの区画だけが元のまま地面に描かれている。屋根はなく、部屋の境だけがある。町の形は残っているのに、そこにあった生活だけが完全に抜き取られた場所。', updated_at = now()
where slug = 'Mvs56E7i' and md5(description) = '494cbc92a4720e70d2712d06966e18b1';

-- コンソンノ 玩具の街（Consonno）（sDGqDpaA）
update public.spots set description = '1962年、実業家マリオ・バーニョが中世からの小さな村を丸ごと買い取り、ミネアレットのある大通り、中華風の門、ダンスホール、動物園を備えた「玩具の街」に造り替えた。しかし1976年の地滑りで唯一の道路が寸断され、客足は途絶え、計画は放棄される。いまは半分だけ完成した遊興施設が森の中に残り、モスク風の尖塔とアーケードの柱だけが木立の上に突き出している。舗装の割れ目から草が伸び、風でシャッターが鳴る。「観光地として楽しまれるため」だけに作られた街が、その目的を一度もほとんど果たせないまま五十年放置されている。', updated_at = now()
where slug = 'sDGqDpaA' and md5(description) = '9d7afc02db0b8ae66a5d3e8c57f989d0';

-- カヤキョイ（Kayaköy）石の村（RpUyExpq）
update public.spots set description = 'かつてレヴィッシと呼ばれ、二千人以上のギリシャ正教徒が暮らしていた村。1923年のギリシャ・トルコ住民交換で全住民が去り、以後だれも住まないまま丘の斜面に残された。石造りの家が約500棟、屋根だけを失って外壁と窓枠を保ったまま等高線に沿って積み上がっている。どの家も同じ石、同じ高さ、同じ向きで、通りを上がっても景色が反復する。教会のドームの下には床のモザイクが残り、割れた天窓から光が落ちる。生活の器だけが完全な形で残り、そこにいた人々だけが一斉に抜き取られた——百年前に時間が止まった斜面。', updated_at = now()
where slug = 'RpUyExpq' and md5(description) = '25517d3110abb45916ec18e8cbe56475';

-- エジプト新行政首都 政府地区（New Administrative Capital）（gEpPMKQ6）
update public.spots set description = '2015年に発表され、約700km²——シンガポールに匹敵する面積の砂漠に、ゼロから建設が進むエジプトの新しい首都。議会、大統領府、省庁、中央銀行、アフリカ一高いビル、エジプト最大級のモスクと中東最大の大聖堂が並び、幅の広い大通りが直線で交差する。すでに官庁は移転を始めているが、想定人口650万人に対して実際に暮らす人はまだごく一部で、街路の多くは新品のまま静まり返っている。砂色の石とガラスがどこまでも続き、建設クレーンの影だけが動く。都市の骨格が先に完成し、そこに入るはずの人々の到着を待っている——「まだ始まっていない首都」という時間のなかにある場所。', updated_at = now()
where slug = 'gEpPMKQ6' and md5(description) = 'b4fe5f4db76ba43652fad7676ffff37a';

-- スコピエ中央郵便局（Главна пошта / Skopje Main Post Office）（ib3BSyoC）
update public.spots set description = '1963年の大地震で壊滅したスコピエの再建計画のなかで、1974年から段階的に建てられた中央郵便局。1982年に完成した中央ホールは、花が開くような放射状のコンクリートのリブに覆われ、そこから太い円筒が何本も突き出している。地元では「宇宙船」と呼ばれてきた。窓の少ない外壁と、乾いたコンクリートの色、そして人の背丈に合わない開口部——地震のあとの都市が思い描いた未来の形が、そのまま川辺に置かれている。2013年の火災以降は封鎖され、車の行き交う橋のすぐ横で、誰も入れない巨大な花だけが立ち続けている。', updated_at = now()
where slug = 'ib3BSyoC' and md5(description) = '0b46863630166a35963db18390683e23';

-- スコピエ中央郵便局（Главна пошта / Skopje Main Post Office）（ib3BSyoC）
update public.spots set access = '北マケドニア・スコピエ市中心部、ヴァルダル川の南岸、ゴツェ・デルチェフ橋のたもと。市バスの結節点が近く、旧市街（オールド・バザール）からは徒歩約10分。2013年の火災で被害を受け、中央ホールは立入禁止。', updated_at = now()
where slug = 'ib3BSyoC' and md5(access) = 'd2051407c23797230528f139cd6d4552';

-- ホー・トゥイ・ティエン 廃ウォーターパーク（Hồ Thủy Tiên）（qptwvrZR）
update public.spots set access = 'ベトナム中部フエ市の南約8km、トゥイバン地区の湖畔。フエ市街からバイクタクシーまたはタクシーで約20分。2024年から公共公園として改修が進み、現在は入場無料で遊歩道も整備されている（駐車料金は別途）。古い構造物の周辺は足元に注意。滑りやすく崩れかけた構造物が多いので足元に注意。', updated_at = now()
where slug = 'qptwvrZR' and md5(access) = '82a27608008c0aa0f139ce1932ae68ab';

-- ホー・トゥイ・ティエン 廃ウォーターパーク（Hồ Thủy Tiên）（qptwvrZR）
update public.spots set description = '2004年に開業しながら、来園者が集まらず数年で運営が止まった湖畔のウォーターパーク。湖の中央には、口を開けた巨大なドラゴンの形をした水族館が残り、その内部の水槽は空のまま藻に覆われている。長く放置された滑り台や管が草に飲まれていたが、2024年からは公園として改修が進み、ドラゴンの建物は新しい遊歩道の先に残されている。「楽しむための場所」としての設備が完全に揃っているのに、その用途を果たす人が一人もいない——設計された賑わいの不在が、そのまま形として残っている場所。', updated_at = now()
where slug = 'qptwvrZR' and md5(description) = 'c6d1f8ad7fda25db3d7c0adfb6afc33a';

-- クラーコ（Craco）丘の上の廃村（QAKdeuaZ）
update public.spots set description = '紀元前八世紀の墓が見つかり、十一世紀には記録に名が現れる村、丘の頂に塔と石造りの家が積み上がった村。1963年以降、地滑りと洪水、1980年の地震が重なり、住民は麓の新集落へ移された。以後、誰も住まないまま斜面の上に残り、家々は屋根を失いながらも輪郭を保っている。周囲は「カランキ」と呼ばれる粘土質の裸地で、木も畑もなく、風が村の空洞を抜けていく。石畳の坂を上がると、扉のない入口が続き、その向こうに空が見える。千二百年つづいた集落が、六十年前のある時点で一斉に止まったまま、丘の上でゆっくり崩れている。', updated_at = now()
where slug = 'QAKdeuaZ' and md5(description) = '44c597fcdd1475b2cc056f831d659df0';

-- クラーコ（Craco）丘の上の廃村（QAKdeuaZ）
update public.spots set access = 'イタリア・バジリカータ州マテーラ県。マテーラ市街から車で約1時間、バーリ空港からは約2時間。崩落の危険があるため自由な立入は禁止で、ヘルメット着用のガイドツアーでのみ旧市街に入れる。', updated_at = now()
where slug = 'QAKdeuaZ' and md5(access) = '239a5d4fcda3f0d35e198177ab30f9ac';

-- バッファロー・セントラル・ターミナル（Buffalo Central Terminal）（UeKBsfTf）
update public.spots set description = '1929年開業、17階建ての塔を備えた全長約160mのアール・デコ様式の鉄道駅。一日に約200本の列車が発着し、コンコースには一日に何千人もが行き交った。だが鉄道旅客の衰退とともに利用は減り続け、1979年に最後の列車が出たきり閉鎖された。ヴォールト天井のコンコースはいまも当時の大きさのまま残り、長く放置されて天窓が割れ、床にタイルが落ちていたが、いまは再生に向けた工事が進んでいる。、音が遠くの壁まで往復して返ってくる。「人が通過するために」設計された最大級の空間が、四十年以上誰にも通過されないまま立っている。', updated_at = now()
where slug = 'UeKBsfTf' and md5(description) = '715f42c3b1146a79312cee4dbb93baa1';

-- バッファロー・セントラル・ターミナル（Buffalo Central Terminal）（UeKBsfTf）
update public.spots set access = '米国ニューヨーク州バッファロー、ポーランド系住民が多いブロードウェイ＝フィルモア地区。ダウンタウンから車で約10分。保存団体が管理しており、現在は改修工事のため内部は非公開（コンコースの再開は2027年予定）。', updated_at = now()
where slug = 'UeKBsfTf' and md5(access) = '0af99560f86bc7fd13ec66baf959eb2d';

-- ボストン市庁舎前広場（City Hall Plaza）（65CEvUYF）
update public.spots set description = '1968年完成の市庁舎と、その前に広がる約2.8ヘクタールのレンガ敷きの広場。上層階が下層より大きくせり出した逆ピラミッド状のコンクリート塊が、長年、屋根も木もほとんどない平原のような舗装の上に置かれていた（2022年の改修で植樹や遊び場が加わった）。ヨーロッパの広場を手本にしたはずが、スケールが大きすぎて日常の人通りでは埋まらず、冬は風の通り道になり、夏はレンガの照り返しが強い。斜めに横切る人の影だけが動き、庁舎の窓の格子が規則的に反復する。都市の中心として設計された空白が、都市に使いこなされないまま半世紀そこにある。', updated_at = now()
where slug = '65CEvUYF' and md5(description) = '9d9f00d7a6f1ff273c4d6b32c6251c1b';

-- 東大門デザインプラザ（DDP / 동대문디자인플라자）深夜のスロープ（xjHULppd）
update public.spots set description = '2014年開業、ザハ・ハディド設計。4万5000枚のアルミパネルで覆われた銀色の塊で、同じ形のパネルはひとつもない。外壁・床・天井が切れ目なくつながり、建物の輪郭がどこで終わるのかが見た目で判断できない。外周を回るスロープは緩やかに上下しながら屋上へ抜け、途中に目的地がないまま歩き続けることになる。深夜、照明の落ちた外壁が街灯の光だけを鈍く返し、周囲の卸売市場の喧騒が遠ざかると、銀色の曲面の下に自分の足音だけが残る。方向も階層も消された、都市の中心にある無重力のような表面。', updated_at = now()
where slug = 'xjHULppd' and md5(description) = 'd86f0c21efc2964d0430affe4155f1ae';

-- ロッテルダム中央駅（Rotterdam Centraal）木造格子のホーム（SdUSWAUL）
update public.spots set description = '2014年に全面改築された駅。市の中心へ向かって鋭く尖った金属の屋根が南の広場へ突き出し、その内側ではホールの天井を木の細板が格子状に覆い、その先でガラスの屋根がホームを一続きに覆う。天井のガラス面から落ちる光が木の格子で細かく切り分けられ、床にいつも同じ模様を投げかける。ガラス張りのホールが広場とそのままつながっているため、「駅に入った」という区切りの感覚が生まれない。始発前の静かな時間、格子模様だけが動かずにそこにある。到着でも出発でもない、都市がただ通過され続けるための屋根。', updated_at = now()
where slug = 'SdUSWAUL' and md5(description) = 'b15459b59cc52cfcc614978e269242b5';

-- ロッテルダム中央駅（Rotterdam Centraal）木造格子のホーム（SdUSWAUL）
update public.spots set access = 'オランダ・ロッテルダム市中心部。アムステルダムから特急で約40分、地下鉄D・E線とトラムが乗り入れる。深夜1時〜5時台は列車の本数が減り、ホームの人影がほとんどなくなる。', updated_at = now()
where slug = 'SdUSWAUL' and md5(access) = '032a29799ed566beb92272ee8dc21e99';

-- 新神戸オリエンタルシティ（XBXoFcN3）
update public.spots set description = '新神戸駅に直結する、ホテル・商業施設・劇場からなる大規模な複合施設。商業ゾーンは2019年に「コトノハコ神戸」として名称を変え、現在も営業している。駅の目の前にありながら、時間帯によっては広い通路や吹き抜けにほとんど人の姿がなく、日常のすぐそばに非日常が広がっているような感覚を味わえる。', updated_at = now()
where slug = 'XBXoFcN3' and md5(description) = 'e44d1db0247eb8d9450e909508133736';

-- 大そね診療所（7KAQpruD）
update public.spots set description = '白い外壁が目を引く、木造平屋（一部2階建て）の古い診療所の跡。戦後まもない頃にはすでに同じ場所に建っていたとされ、閉院からは長い年月が経っている。窓の奥では室内にまで草木が入り込み、かつての診察の場と自然の境目があいまいになっている。私有の建物のため、公道から外観を眺めるだけにしたい。', updated_at = now()
where slug = '7KAQpruD' and md5(description) = '3359085d6c5a8f26888b809fed69944e';

-- 青柳冷蔵（THCu2F55）
update public.spots set description = '美唄市の道道沿いに残る、冷蔵会社の建物の跡。1970年代にはすでに稼働していたとされ、閉業してから長い時間が経っている。錆びた鉄骨と崩れかけた屋根の下に、使われなくなった倉庫の広い空間だけが残る。私有の建物で崩落の危険もあるため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'THCu2F55' and md5(description) = 'b1dbe743340ea4b93fe2ec32abf4cf63';

-- H工業（瀬戸市）（U7zX35uL）
update public.spots set description = '瀬戸市の山あいに残る、砕石施設だったとされる工場の跡。1970年代から同じ場所にあり、いつからか使われなくなった設備が、そのまま風雨にさらされている。川の向こうでは今も工場が動いていて、止まった場所と動いている場所が隣り合う。私有地のため、敷地には入らず外から眺めたい。', updated_at = now()
where slug = 'U7zX35uL' and md5(description) = '7d29cc819f70d123c8dbcc00ded7d453';

-- 皆川製材所（J2CGffXY）
update public.spots set description = '阿賀町の、細長い建物が何棟も連なる製材所の跡。1970年代には操業していたとされる。屋根は少しずつ傾き、敷地を覆う草木の中で、一部の棟はすでに崩れ落ちている。木を挽いていた場所が、今は木々に取り込まれつつある。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'J2CGffXY' and md5(description) = '5cc6c9148da1cccde480ab48026b3328';

-- 太陽工芸（小千谷市）（DGSjLBzU）
update public.spots set description = '小千谷市に残る、2階建ての工場と平屋の建物からなる事業所の跡。1970年代後半以降に建てられたとされる。壁がはがれ落ちて骨組みがのぞき、建物の脇には古い車がそのまま置かれている。止まった時間がそのまま形になったような場所。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'DGSjLBzU' and md5(description) = '22a0823911299a3680048ec73b925fe7';

-- 常陸太田市徳田町の工場跡（JzVmBYUD）
update public.spots set description = '常陸太田市徳田町に残る工場の跡。大きな建物がL字型に並び、そのまわりに小さな建物がいくつか建っていた。年月とともに一部は姿を消し、残った建物も壁が抜けて骨組みだけになりつつある。敷地は深い藪に沈み、道からは緑の奥に鉄骨の影が見えるだけになっている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'JzVmBYUD' and md5(description) = '1e8c15997ed9bfb939b5872b54e12abf';

-- 斉藤板金塗装（鹿嶋市大船津の工場跡）（Y9AGyNch）
update public.spots set description = '鹿嶋市大船津に残る、1970年代前半に建てられたとされる工場の跡。1990年代初めまでには閉業したとみられ、屋根は年を追うごとに崩れ、今では錆びた骨組みが緑に埋もれている。建物の輪郭だけが、そこに仕事場があったことを伝えている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'Y9AGyNch' and md5(description) = 'f756207e52a3d12deb0a35447bf54bca';

-- T製材所（9iCXcXZo）
update public.spots set description = '大きな煙突を持つ製材所と、木造の材木置き場、道をはさんだ社宅や寮がひとまとまりで残る場所。雪で屋根が崩れたことをきっかけに、2011年頃に操業を終えたとされる。建物の一部はすでに崩れ、草木に埋もれながら、働く人と暮らす人がいた小さな集落の形だけが残っている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = '9iCXcXZo' and md5(description) = '3d2c80dcbc7efe050365e1db19533d8c';

-- 小国町沼沢の廃工場（EDs7a2go）
update public.spots set description = '小国町沼沢に残る、鉄骨造の工場の跡。産業廃棄物の処理に使われていたとされる。豪雪地帯の雪の重みで建物全体が押しつぶされるように崩れ、今も少しずつ形を失い続けている。崩落の危険が大きいため、近づかず、道路から眺めるだけにしたい。', updated_at = now()
where slug = 'EDs7a2go' and md5(description) = '8e4fc3ce29805db9b4c6293de4e02cbf';

-- エビス水産（cwDnEETU）
update public.spots set description = '1970年代から倉庫や工場が並んでいた水産工場の跡。事務所棟や冷凍倉庫が残る一方で、奥の工場棟は赤く錆びた骨組みだけになり、敷地には草木が広がっている。止まった冷凍設備だけが、そこで流れていた時間を閉じ込めている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'cwDnEETU' and md5(description) = 'a64f0ae268dbbf48ffb3be5867da4520';

-- 竹馬製材所（vQ4mzPej）
update public.spots set description = '1970年頃に開かれたとされる、平屋建ての製材工場の跡。長く使われないうちに、敷地の木々は屋根より高く育った。蔦に覆われた建物の中には製材の機械が残り、窓の割れた事務室にはソファや冷蔵庫がそのまま置かれている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'vQ4mzPej' and md5(description) = '407c9d43aa694910bbb4f036ddb7d99b';

-- キリン乳業（株）関東工場（mmjcDRkP）
update public.spots set description = '日光市の国道119号（日光街道）沿いに残る、冷凍食品の工場の跡。閉業の時期ははっきりしないが、長く使われないまま、屋根の一部は大きくゆがんでいる。街道に面した門には蔦が絡み、敷地の奥には複数の建物と古い車両が残る。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'mmjcDRkP' and md5(description) = 'a694a527b7e1b12d4f60598d8f7a3cce';

-- ムライ機器（独身寮、工場）（8fc35gjH）
update public.spots set description = '瑞浪市の国道19号近くに残る、4階建ての独身寮と2階建ての工場の跡。1970年代に建てられたとみられ、近くに移転した後に使われなくなったらしい。外壁ははがれ落ち、夏には壁一面を蔦が覆う。同じ間取りの窓が並ぶ寮の建物には、かつての暮らしの気配だけが残っている。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = '8fc35gjH' and md5(description) = 'a8b055e9e79ec8f055498eabbadd42f1';

-- 桜川市真壁町椎尾の工場跡（UpHfUMhu）
update public.spots set description = '桜川市真壁町椎尾に残る、用途のわからない工場の跡。1970年代から同じ場所にあったとされる。屋根や壁が失われて骨組みがむき出しになり、特に裏手は大きく崩れている。何を作っていたのかも分からないまま、建物だけが静かに朽ちていく。私有地のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'UpHfUMhu' and md5(description) = 'de4619bf5fc1d801a0351de91b449e9a';

-- 富士川町鰍沢の工務店跡（ALMwC5bG）
update public.spots set description = '富士川町鰍沢の国道52号（富士川街道）沿い、小室山入口バス停の前に残る2階建ての建物の跡。工務店として紹介されることもある。建物は蔦に覆われ、近年は2階の屋根が崩れ落ちた。バス停の目の前で、街道を行き交う車の横に取り残されたような姿を見せている。私有の建物のため、外から眺めるだけにしたい。', updated_at = now()
where slug = 'ALMwC5bG' and md5(description) = 'cd3530f94810d60ef94d073f97fcb862';

-- 次のスポットを非公開にする（status を hidden にするだけなので、あとで戻せる）
--   fJuqsLen 阿賀野ファミリーランド跡：実在しない遊園地（SNS上の創作）。ロックアドベンチャーはサントピアワールドで営業中
--   9gxjLGp8 ウェスタン村：日光ウエスタン村（廃墟） QxTyYMA9 と同じ場所の重複登録
--   LjapW5Hz 清澄白河駅：清澄白河駅の不気味な通路 vbUQ9kcZ（記事からリンクあり）と同じ場所の重複登録
--   KCC4DazC 旧・足利東映プラザ劇場：2025年に解体され、建物が残っていない
--   XEZUwT7C 渓谷荘(定山渓温泉) と 2tz9ibsF ホテル渓谷荘：同じ建物の重複登録で、2020年に解体が確認されている
--   uhtHKNAA 市営領家立野団地跡：さいたま市の公式サイトでは今も市営住宅として載っており、人が住んでいる可能性があるため
update public.spots set status = 'hidden', updated_at = now()
where slug in ('fJuqsLen', '9gxjLGp8', 'LjapW5Hz', 'KCC4DazC', 'XEZUwT7C', '2tz9ibsF', 'uhtHKNAA') and status = 'published';

-- 新神戸オリエンタルシティ（営業中）から「廃墟」タグを外す
delete from public.spot_tags
where spot_id = (select id from public.spots where slug = 'XBXoFcN3')
  and tag_id = (select id from public.tags where name = '廃墟');

commit;

-- 確認用：書き換わった件数（145件になっていれば全件反映）
select count(*) as updated_rows from public.spots where updated_at > now() - interval '5 minutes';
