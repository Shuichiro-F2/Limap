# Limap

世界中のリミナルスペースを写真と情報付きで登録・共有するアプリ（MVP）。

## 技術構成

- Expo (React Native, TypeScript) — iOS / Android / Web を単一コードベースで
- Supabase — 認証・DB（Postgres）・画像ストレージ
- Mapbox（`@rnmapbox/maps`）— 地図表示
- React Navigation — 画面遷移

## セットアップ手順

### 1. Supabase プロジェクト作成

1. https://app.supabase.com で新規プロジェクトを作成
2. SQL Editor で `supabase/migrations/0001_init.sql` の内容を実行
   - profiles / spots / spot_images / spot_tags / likes / reports テーブル
   - 新規登録時に profiles を自動作成するトリガー
   - 通報が3件溜まると自動非表示にするトリガー（`status = 'hidden'`）
   - `spot-images` Storage バケット
3. Authentication → Providers で Email、Google、Apple を有効化
   - Google/Apple は各プロバイダのOAuthクライアント設定が別途必要です
4. Settings → API から `Project URL` と `anon public key` を取得

### 2. Mapbox トークン取得

1. https://account.mapbox.com/access-tokens/ で Access Token（public, `pk.`）を取得
2. ネイティブビルド用に Download Token（secret, `sk.`）も取得し、`app.json` の
   `MAPBOX_DOWNLOAD_TOKEN_PLACEHOLDER` を置き換える

### 3. 環境変数設定

```
cp .env.example .env
```

`.env` を編集し、`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `MAPBOX_ACCESS_TOKEN` を設定。

### 4. 依存関係インストール・起動

```
npm install
npx expo prebuild   # @rnmapbox/maps はネイティブモジュールのため prebuild が必要
npm run ios         # または npm run android
```

Mapbox SDK はネイティブコードを含むため、Expo Go では動作しません。
`expo prebuild` で生成したネイティブプロジェクトを Xcode / Android Studio、
または `expo run:ios` / `expo run:android` で実行してください。

## ディレクトリ構成

```
src/
  lib/          Supabaseクライアント、認証コンテキスト、データ操作関数
  screens/      画面コンポーネント（地図・投稿詳細・投稿作成・認証）
  navigation/   React Navigation の設定
  types/        型定義
supabase/
  migrations/   DBスキーマ（SQL）
```

## 実装済み機能（MVP範囲）

- メール認証（サインアップ / ログイン）、Google / Apple ログインの導入口
- 地図上でのスポット表示（表示範囲内のみ取得、ダークテーマの地図スタイル）
- スポット投稿（タイトル・説明・位置情報・雰囲気タグ・写真最大5枚）
- いいね機能
- 通報機能（事後モデレーション、3件で自動非表示）

## 未実装・今後の検討事項

- Google / Apple OAuth のネイティブフロー（`expo-auth-session` 等での実装が必要）
- プロフィール編集画面、投稿一覧（マイページ）
- 通報の管理画面（運営が `status` を戻す/確定するUI。現状はSupabase管理画面から直接操作）
- 検索・タグ絞り込みUI
- 多言語対応、プッシュ通知
- 位置情報の精度によるプライバシー配慮（座標の丸め処理など）

## 次のステップの目安

1. Supabase / Mapbox のアカウントとキーを用意し、上記セットアップを実施
2. 実機またはシミュレータで一通りのフロー（登録→投稿→地図表示→通報）を確認
3. 知人など少人数のクローズドベータで投稿してもらい、モデレーションの運用を試す
4. 問題なければストア申請（App Store / Google Play）の準備へ
