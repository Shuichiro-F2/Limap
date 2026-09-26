# LIMap リリース・更新手順（Web版 / iOSアプリ版）

## 前提となる構成

| 項目 | 値 |
|---|---|
| リポジトリ | `~/Developer/limap` → `github.com/Shuichiro-F2/Limap`（`main` のみ） |
| フレームワーク | Expo SDK 57 / React Native 0.86 / react-native-web |
| Web ホスティング | Vercel。`main` への push で自動デプロイ。ビルド = `npx expo export --platform web` → `dist` |
| アプリ配信 | EAS Build + EAS Submit + **EAS Update**（`expo-updates` 導入済み） |
| EAS projectId | `cfe0c767-a429-4d68-8550-4ed4da2cf1d3` |
| production ビルドの channel | `production`（`eas.json`） |
| buildNumber 管理 | `appVersionSource: "remote"` + `autoIncrement: true` → **EAS サーバー側で自動採番。手で触らない** |
| runtimeVersion | `{ "policy": "appVersion" }` → **`app.json` の `version` の値がそのまま runtimeVersion** |

Web とアプリは同一コードベースだが、**配信経路が完全に別**。`main` への push で更新されるのは Web のみで、アプリには何も届かない。

---

## 判断表：変更内容 → 必要な作業

| 変更内容 | Web（push） | アプリ OTA（`eas update`） | 再ビルド + 審査 |
|---|---|---|---|
| コラム記事の追加・修正 | ○ | ○ | — |
| UI・文言・スタイル・画面ロジック | ○ | ○ | — |
| Supabase クエリ、JS 側のバグ修正 | ○ | ○ | — |
| `assets/` の画像差し替え（アイコン/スプラッシュ以外） | ○ | ○ | — |
| npm パッケージ追加（**JSのみ**のもの） | ○ | ○ | — |
| ネイティブモジュール追加・更新（`@rnmapbox/maps`, `expo-location` 等） | ○ | — | **必須** |
| `app.json` のネイティブ設定（権限文言、`infoPlist`、plugins、bundleId） | ○ | — | **必須** |
| アプリアイコン・スプラッシュ画像 | ○ | — | **必須** |
| Expo SDK / React Native のバージョンアップ | ○ | — | **必須** |
| `app.json` の `version` を上げる | ○ | — | **必須**（後述） |
| **Supabase のスキーマ・RLS・トリガーのみの変更** | — | — | — |

---

## A. Web だけを更新する

```bash
cd ~/Developer/limap
# 変更 → 記事の場合は npm run articles:build
git add -A && git commit -m "..." && git push origin main
```
Vercel が自動でデプロイ。1〜2分で https://limap.jp に反映。

## B. アプリに JS 変更を届ける（OTA / 審査不要）

```bash
cd ~/Developer/limap
npx eas-cli update --branch production --environment production --message "コラム記事『◯◯』を追加"
```

- **`--branch production` を必ず明示する。** `--auto` は git のブランチ名（= `main`）を branch 名に使うため、production ビルドが購読している `production` チャンネルに届かない。
- **`--environment production` も付ける。** 省略すると `? Select environment:` という対話プロンプトが出て止まる。これは EAS の**環境変数をどの環境のものでバンドルするか**という指定で、`--branch` とは別物。
- 反映タイミングはユーザーの**次回アプリ起動時**（起動時にDLして、その次の起動で適用されるのが既定挙動）。
- 配信対象は「今 `app.json` に書かれている `version` と同じ runtimeVersion を持つビルド」のみ。
- Web の push と OTA は別作業。**両方に届けたい変更は、push と `eas update` の両方を実行する。**
- Expo アカウントへのログインが必要（`npx eas-cli whoami` で確認）。

## C. ネイティブ変更 → 再ビルド + App Store 審査

```bash
cd ~/Developer/limap
# 1. app.json の "version" を上げる（例 1.0.0 → 1.1.0）。buildNumber は触らない
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
# 2. TestFlight で実機確認 → App Store Connect で審査提出
```

- `.env` の `MAPBOX_DOWNLOAD_TOKEN` が必要（`app.config.js` が読む）。EAS 上でビルドする場合は EAS Secrets に登録されていること。
- 審査は通常 1〜3日。

## D. Supabase（DB）だけを変更する — Web・アプリ同時に即反映

Web版もアプリ版も同じ Supabase プロジェクトを見ているため、**DBの中だけで完結する変更は、push も `eas update` も再ビルドも一切不要**で、SQL を流した瞬間に両方へ反映される。

1. `supabase/migrations/` に連番で `.sql` を追加
2. Supabase ダッシュボード → SQL Editor に内容を貼り付けて実行（**1回だけ**）
3. 実際に反映されたか確認クエリで目視
4. SQLファイルを commit → `git push origin main`（履歴を残すためだけ。Vercel のデプロイは走るが実質no-op）

このパターンに当てはまる変更の例：デフォルトフォロー、バッジ付与、RLSポリシーの調整、集計トリガーの追加、マスタデータの追加。

**注意**：`create table` を含む migration は再実行すると失敗する。SQL Editor で二重実行しないこと。破壊的な変更の前は Supabase のバックアップ状況を確認しておく。

---

## ⚠️ 特に事故りやすい3点

### 1. `version` を上げると OTA の配信先が切り替わる

`runtimeVersion.policy = "appVersion"` のため、`app.json` の `version` を `1.0.1` にした瞬間、runtimeVersion も `1.0.1` になる。

- **JSだけの修正で `version` を上げてはいけない。** 上げると、既にインストール済みの 1.0.0 ユーザーには更新が一切届かなくなる。
- 新バージョンを申請したあとに旧バージョン向けの緊急修正を出したい場合は、`app.json` の `version` を旧値に戻した状態で `eas update` する。
- 運用ルール：**`version` を上げるのは「ビルドを作って審査に出すとき」だけ。**

### 2. Supabase のスキーマ変更は後方互換必須

App Store 版はユーザーが更新しない限り古いバイナリが端末に残り続ける。カラム削除・型変更・レスポンス構造の変更は、旧バージョンのアプリを壊す。

- 原則：**追加は自由、削除・変更は猶予期間を置く**（新カラムを足す → アプリ側を両対応にする → 十分に普及してから旧カラムを消す）
- RLS ポリシーの変更も同様に旧バージョンへの影響を確認する。

### 3. 記事追加はアプリ側に自動では出ない

`src/lib/articles.ts` の `ARTICLE_ENTRIES` はアプリ内コラムタブの一覧データ。push しただけでは Web にしか反映されない。記事を出したら `eas update` までがワンセット（→ `docs/article-publishing-workflow.md` の手順6）。

---

## リリース前チェックリスト

**OTA（B）の場合**
- [ ] `app.json` の `version` を触っていないか
- [ ] Web で表示確認済みか（`npm run web`）
- [ ] `--branch production` と `--environment production` を指定したか
- [ ] Supabase 側に破壊的変更を含んでいないか

**再ビルド（C）の場合**
- [ ] `app.json` の `version` を上げたか（buildNumber は触らない）
- [ ] TestFlight で実機確認したか（特に位置情報・写真・Apple サインイン）
- [ ] リリースノートを用意したか
- [ ] 審査通過後、`version` が上がった状態が `main` にコミットされているか

---

## メモ

- EAS CLI はグローバル未導入の場合 `npx eas-cli <command>` で実行可能。
- `dist-check/` 〜 `dist-check39/` はビルド検証の残骸。`.gitignore` 済み。削除して問題ない。
- Android 版（`com.v.xo2.limap`）の設定は `app.json` に入っているが、Google Play への提出はまだ。出す場合は `--platform android` で同じフローが使える。
