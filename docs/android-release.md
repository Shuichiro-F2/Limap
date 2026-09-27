# Android 版（Google Play）提出の準備

2026-09-28 時点の状況と、提出までに必要な作業のまとめ。リリース全般のルールは `docs/release-workflow.md`。

## 今の設定（確認済み）

- パッケージ名：`com.v.xo2.limap`（開発ビルドは `com.v.xo2.limap.dev`。`app.config.js`）
- アダプティブアイコン：前景・背景・モノクロの画像あり（`app.json` の `android.adaptiveIcon`）
- 権限：位置情報（`ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`）
- バージョン番号：`eas.json` が `appVersionSource: remote` ＋ `autoIncrement`（versionCode は EAS 側で自動採番。触らない）
- EAS Update：iOS と同じ `production` チャンネル。Android 版も `eas update` で JS の変更が届く
- Ko-fi の支援導線：Web 版のみ表示（`Platform.OS === 'web'`）。Android アプリにも出ない
- アカウント削除：アプリ内（マイページ右上のメニュー →「アカウントを削除」）。Google Play が求める「アプリの外から削除方法が分かる URL」として、使い方ページ（https://limap.jp/help）に手順を載せた
- プライバシーポリシー：https://limap.jp/privacy

## 提出前に直すべきこと

### Google ログインがネイティブアプリで動かない（iOS も同じ）

`src/lib/AuthContext.tsx` の `signInWithOAuth` は Web 前提の作りで、ネイティブでは何も起きない（supabase-js はブラウザのときだけログイン画面へ移動し、それ以外は URL を返すだけ）。iOS は Apple ログインとメールがあるので実害が小さいが、Android ではメールでしかログインできない。

直し方（ネイティブの変更。Android の初回ビルドと、次の iOS の審査に出すビルドで入れる）：

1. `expo-web-browser` を入れる（ネイティブモジュール）
2. `app.json` に URL スキーム（例：`"scheme": "limap"`）を追加
3. `signInWithOAuth` をネイティブでは `skipBrowserRedirect: true` ＋ `redirectTo`（`limap://auth/callback` など）で呼び、`WebBrowser.openAuthSessionAsync` で開き、戻ってきた URL のコードを `supabase.auth.exchangeCodeForSession` に渡す
4. Supabase ダッシュボードの Authentication → URL Configuration の Redirect URLs に同じ URL を追加

それまでの間は、ネイティブでは Google ボタンを隠す（JS だけの変更で OTA で配信できる）という手もある。

## Shu さんの作業が必要なもの

- Google Play Console のデベロッパー登録（初回のみ 25 ドル）と、アプリの作成
- 初回の AAB は Play Console に手動でアップロードする（API 経由の `eas submit` は2回目以降から）。`eas submit` を使うなら、Google Cloud のサービスアカウントの JSON キーを作って EAS に登録する
- 実機での確認：この Mac には Android SDK・Java が無いため、エミュレーターは使えない。Android 端末があれば、EAS の `preview` プロファイルで作った APK を入れて確認できる（`eas build` なので実行前に確認）
- ストアの「データセーフティ」「コンテンツのレーティング（IARC）」「対象年齢」「広告の有無（なし）」の回答（下の下書きを使う）

## ストアの掲載情報（下書き）

### 日本語

- アプリ名（30字まで）：LIMap - リミナルスペースの地図
- 簡単な説明（80字まで）：人の気配が消えた、不気味で懐かしい場所「リミナルスペース」を地図で探して、写真で共有するアプリ
- 詳しい説明：

```
LIMap（リマップ）は、リミナルスペースを地図で探して、写真と場所で記録・共有するアプリです。

リミナルスペースとは、人の気配が消えた、どこか不気味で懐かしい「境界」の空間のこと。誰もいない地下通路、閉店後のショッピングモール、終電後の駅、役目を終えた駅舎や展望台――。LIMapには、日本各地と世界のリミナルスペースが登録されています。

■ 地図で探す
地図のピンをタップすると、写真や説明、行き方を確認できます。ログインしなくても、地図の閲覧や検索は自由に使えます。

■ タグやキーワードで探す
「地下通路」「団地」「廃線跡」「プールコア」など、タグやキーワードで絞り込めます。

■ 見つけた場所を投稿する
無料のアカウント登録で、写真と場所を選んで投稿できます。

■ いいね・行きたい場所・フォロー
気になる場所は「行きたい場所」に保存して、あとから見返せます。

私有地や立入禁止の場所には入らず、ほかの人が写らないように配慮して撮影してください。
```

### English

- App name: LIMap - Map of Liminal Spaces
- Short description: Find eerie, nostalgic liminal spaces on a map, and share the ones you discover.
- Full description:

```
LIMap is an app for finding liminal spaces on a map and sharing them with photos and locations.

Liminal spaces are "in-between" places where people seem to have vanished, eerie yet strangely nostalgic: empty underground passages, malls after closing, stations after the last train, retired station buildings and observation decks. LIMap collects liminal spaces from across Japan and around the world.

- Explore the map: tap a pin to see photos, descriptions and how to get there. No login needed to browse or search.
- Search by tag or keyword: underground passages, housing complexes, abandoned railways, poolcore and more.
- Post what you find: create a free account to post a place with photos and its location.
- Likes, saved places and follows: save places you want to visit and come back to them anytime.

Please do not enter private property or restricted areas, and take care not to photograph other people.
```

### 画像

- アイコン 512×512（`assets/icon.png` から書き出し）
- フィーチャーグラフィック 1024×500（新しく作る）
- スマホのスクリーンショット 2〜8枚（地図・スポット詳細・検索・投稿など）

## データセーフティ（下書き）

| データ | 収集 | 共有 | 用途 | 任意か |
|---|---|---|---|---|
| メールアドレス | する | しない | アカウント管理 | 必須（登録する場合） |
| ユーザー名・プロフィール画像 | する | しない（ほかの利用者に表示される） | アプリの機能 | 任意 |
| 写真 | する（投稿したもの） | しない（公開投稿として表示される） | アプリの機能 | 任意 |
| おおよその位置・正確な位置 | 投稿の位置情報として保存。現在地は地図表示にだけ使い、保存しない | しない | アプリの機能 | 任意 |
| アプリの操作・ログ | サーバーのログ（IP アドレスなど） | しない | 不正防止・分析 | 必須 |

- データは送信時に暗号化（HTTPS）
- アカウントとデータの削除をリクエストできる（アプリ内・https://limap.jp/help）
- 外部サービス：Supabase（データベース・認証）、Mapbox（地図）。プライバシーポリシー第4条のとおり
