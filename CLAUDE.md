@AGENTS.md

# LIMap（limap.jp）

リミナルスペース（人の気配が消えた、どこか不気味で懐かしい場所）を地図上で探し・共有するサービス。日英バイリンガル。開発・運営は Shu の個人開発。

- Web版：https://limap.jp（公開中）
- iOSアプリ：App Store 公開中（bundleId `com.v.xo2.limap`）。Android は設定のみで未提出
- **Web とアプリは同一コードベース**（Expo + react-native-web）。ただし**配信経路は完全に別**（下記「リリース」参照）

会話・コミットメッセージ・コード内コメントは日本語。

## 技術構成

| 領域 | 使用技術 |
|---|---|
| アプリ本体 | Expo SDK 57 / React Native 0.86 / React 19 / TypeScript |
| Web | react-native-web → `npx expo export --platform web` → `node scripts/build-top-page.js` → `dist/` を Vercel でホスト |
| 地図 | ネイティブ：`@rnmapbox/maps`（`MapScreen.tsx`）／Web：`mapbox-gl` + `react-map-gl`（`MapScreen.web.tsx`） |
| バックエンド | Supabase（Auth / Postgres / Storage）。Web とアプリで**同じプロジェクト**を参照 |
| サーバー関数 | `api/*.ts`（Vercel Functions。実行地域は Supabase（東京 ap-northeast-1）に合わせて `vercel.json` の `regions` で東京 `hnd1`。`sitemap.ts`、`spot.ts`＝スポットページのOGP、`page.ts`＝about/help/privacy/terms、`tag.ts`＝タグ別ページ（`/tags`、スポット3件以上のタグだけ。集計は `src/content/tagPages.ts`）、`japan.ts`＝日本のリミナルスペース一覧（`/japan`、都道府県タグで国内判定。**都道府県タグの無い投稿は載らない**）、`instagram-oembed.ts`・`x-oembed.ts`、`delete-account.ts`）。URL との対応は `vercel.json` の rewrites |
| アプリ配信 | EAS Build / Submit / Update（`expo-updates` 導入済み、channel `production`） |

Expo の API は `AGENTS.md` の指示どおり v57 のドキュメントを確認してから使うこと。

## ディレクトリ

```
src/
  screens/      画面。Web専用の実装は *.web.tsx（MapScreen, LocationPickerScreen 等）
  components/   共通UI。InstagramEmbed / XEmbed も .web.tsx で分岐
  lib/          Supabaseクライアント、認証(AuthContext)、データ操作、i18n、theme、articles 等
  navigation/   React Navigation（RootNavigator, MainTabNavigator）
api/            Vercel Functions
content/        記事の元データ（articles.json）
scripts/        generate-articles.js（記事HTML生成）、seed/（公式スポット投入などの運用スクリプト）、check-embeds.mjs（SNS埋め込みが今も見られるかの点検。読むだけ）
public/         Web の静的ファイル。public/articles/ は生成物なので手で編集しない
supabase/migrations/  DB変更の履歴（連番SQL）
```

- 多言語：`src/lib/i18n.tsx`（`useLanguage()`）。**固定UI文言は必ず日英両方を用意する**。ユーザー投稿文は翻訳しない
- 色・フォントは `src/lib/theme.ts` に集約。ダークテーマ固定、フォントは DotGothic16
- Web とネイティブで挙動を変えるときは、`*.web.tsx` か `Platform.OS === 'web'` で分岐する
- Web の初期HTML：`dist/index.html` はトップページ専用（ビルド後に `scripts/build-top-page.js` が本文を入れる）。SPA の各画面と `api/spot.ts`・`api/page.ts` は、本文の無いひな形 `dist/app.html` を使う（`vercel.json` の rewrites）。`public/index.html` の `<div id="root"></div>` はこの仕組みの目印なので形を変えない。サーバー側で入れる本文（`#limap-ssr`）の見た目は `public/index.html` の `#limap-ssr-style` に集約してある
- **アプリに画面（URL）を追加・変更したら、`src/navigation/RootNavigator.tsx` の `linking` と合わせて `vercel.json` の rewrites にも追加する。** 列挙していないURLは 404 ステータス（中身はアプリのひな形 `dist/404.html`）になるため、画面自体は開けるが検索エンジンには登録されない

## よく使うコマンド

```bash
npm run web            # Web版をローカル起動（まずここで確認）
npm run ios            # 開発ビルドで起動（Mapbox はネイティブモジュールのため Expo Go 不可）
npm run articles:build # 記事HTMLを再生成（content/articles.json → public/articles/）
npx tsc --noEmit       # 型チェック
```

- 動作確認は基本 `npm run web` で行う。開発ビルド（`npm run ios`）は 2026年7月以降ほとんど使っていない
- 開発ビルドは EAS の `development` プロファイルで作る：`npx eas-cli build --profile development --platform ios`（`eas build` なので実行前に Shu に確認）。`APP_VARIANT=development` が付き、bundleId `com.v.xo2.limap.dev`・名前「Limap Dev」の別アプリとして配布版と共存する（`app.config.js`）
- `development` プロファイルは `ios.simulator` の指定がないため**実機向け**（internal 配布）。実機の Limap Dev で開くときは `npx expo start` で起動して接続する。`npm run ios` はシミュレーターを開くので、シミュレーター用の開発ビルドが別途必要
- シミュレーター用は `development-simulator` プロファイル：`npx eas-cli build --profile development-simulator --platform ios`（`eas build` なので実行前に Shu に確認）。EAS の `development` 環境には変数が無いため、このプロファイルはネイティブのビルドに必要なトークンを `production` 環境から読む（アプリの JS は手元の Metro から読むので本番データの設定とは無関係）。できた `.tar.gz` を展開して `xcrun simctl install booted LimapDev.app`、`npx expo start --dev-client` で接続する。この Mac には CocoaPods が無いため、ローカルの `expo run:ios` ではなく EAS でビルドしている
- ネイティブモジュールを追加・更新したら開発ビルドも作り直しが必要。2026-08-27 に `expo-apple-authentication` の追加などがあったため、それより前の開発ビルドは今のコードでは動かない
- ローカルで `npx expo run:ios` するなら `APP_VARIANT=development` を付ける（付けないと配布版と同じ bundleId になる）
- 依存は `legacy-peer-deps` 前提（`.npmrc`／Vercel の installCommand も同じ）。peer 依存の警告で止まったら、まずこの設定が効いているか確認する

環境変数は `.env`（Git管理外）。キー一覧は `.env.example`。**`.env` の中身を表示・コミットしないこと。**

- アプリ側（`src/`）は `EXPO_PUBLIC_*` ではなく、`import { … } from '@env'`（react-native-dotenv、`babel.config.js`）でバンドル時に `.env` から埋め込む。そのため `eas update` はローカルの `.env` の値でバンドルされる（`--environment production` は EAS 側の環境変数の指定で、これとは別物）
- `.env` を変えても反映されないときは `npx expo start --clear` でキャッシュを消す
- `MAPBOX_DOWNLOAD_TOKEN` はネイティブビルド時に `app.config.js` が読み込む
- `api/*.ts` は Vercel の環境変数を読む（`SUPABASE_SERVICE_ROLE_KEY` は Vercel にのみ設定）

## リリース（最重要）

詳細は @docs/release-workflow.md。要点：

1. **Web**：`main` に push すると Vercel が自動デプロイ。それだけではアプリには何も届かない
2. **アプリ（JSの変更）**：`npx eas-cli update --branch production --environment production --message "…"`。審査不要、ユーザーの次回起動時に反映
3. **アプリ（ネイティブの変更）**：`app.json` の `version` を上げて EAS Build → Submit → 審査
4. **Supabase だけの変更**：SQL を流した時点で Web・アプリ両方に即反映

守ること：

- **`app.json` の `version` は、ビルドして審査に出すときだけ上げる。** runtimeVersion が `appVersion` ポリシーなので、JSだけの修正で上げると既存ユーザーに OTA が届かなくなる
- `buildNumber` は EAS 側で自動採番。触らない
- `eas update` では `--branch production` と `--environment production` を必ず付ける（`--auto` は使わない）
- Supabase のスキーマ・RLS 変更は**後方互換**必須（古いアプリが端末に残り続けるため）。追加は自由、削除・型変更は段階的に
- 作業の最後に、変更が「Web のみ／OTA も必要／再ビルドが必要／DBのみ」のどれに当たるかを Shu に伝える
- `git push`・`eas update`・`eas build`・`eas submit`・本番DBへのSQL実行は、**実行前に Shu に確認を取る**

## コラム記事（SEO）

記事の追加・修正の前に、必ず `docs/article-publishing-workflow.md` を読んでその手順に従う。1本追加するとき触るのは次の3箇所で、1つでも漏れると分かりにくい不具合になる：

1. `content/articles.json`（本文・日英）
2. `src/lib/articles.ts` の `ARTICLE_ENTRIES`（アプリのコラムタブ一覧）
3. `npm run articles:build` で `public/articles/`・`public/en/articles/`・`src/content/articleIndex.json`（sitemap が読む）を再生成

追加後は `node scripts/check-articles.js` で整合性を確認する。記事の写真は、自前の写真がほとんど無いため X・Instagram の投稿の埋め込み（`sections[].embeds`）を多用する。

記事を出したら、push に加えて `eas update` までがワンセット（アプリのコラムタブに反映するため）。

## 公式スポットの追加・説明文

2026-09-27 に公式スポット265件の説明文を点検したところ、約4割に事実の誤り（営業中なのに「廃墟」、解体済みなのに「残っている」、年代・駅名の誤りなど）があり、実在しない場所（SNS上の創作）も1件含まれていた。また15件は他サイト（廃墟検索地図）の文章とほぼ同じだった。修正の記録は `supabase/migrations/0023_fix_official_spot_descriptions.sql`。公式スポットを追加・編集するときは次を守る：

- 公開前に、場所が実在すること、今も営業中か閉業・解体済みか、年代・設計者・用途などの具体的な事実を、公式サイト・自治体・報道などの出典で確かめる。確かめられない事実は書かない（書くなら「〜とされる」と弱める）
- 他サイトの文章を下敷きにしない。事実は参考にしても、文章は LIMap 独自の言葉で書く
- 営業中の施設を「廃墟」と書かない・タグ付けしない。私有地・立入禁止の場所には「外から眺めるだけ」の注意を添える
- 人が住んでいる可能性のある建物（現役の団地など）は、住民のプライバシーに配慮して登録しない
- 登録前に、同じ場所が既に登録されていないか（近い座標のスポット）を確認する

## SNS埋め込みの点検

公開スポットのほとんどは X・Instagram の埋め込みだけで成り立っているため、元の投稿が消えるとスポットから写真が消える。ときどき `node --env-file=.env scripts/check-embeds.mjs <出力先.csv>` で点検する（データは変更しない）。Instagram の判定にはこの Mac の Google Chrome を画面なしで使う。

- シミュレーターの WebView（埋め込みの中）では、日本語の一部が「?」の四角で表示される。シミュレーターに端末標準の日本語フォントが無いためで、実機では起きない

## DB（Supabase）

- 変更は `supabase/migrations/` に連番で `.sql` を追加し、Supabase ダッシュボードの SQL Editor で**1回だけ**実行。そのあと SQL ファイルをコミットして履歴に残す
- `create table` を含む migration を二重実行しない。破壊的変更の前はバックアップ状況を確認

## その他

- `dist/`、`dist-check*/`、`Claude outputs/` はビルド検証や作業の残骸。コミットしない
- 広告は入れない方針（世界観を損なうため）。支援導線は Ko-fi（Web版のみ表示、iOSアプリには出さない）
