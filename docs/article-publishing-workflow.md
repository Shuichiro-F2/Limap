# LIMap コラム記事の入稿・公開手順

Expo（React Native Web）製のアプリ本体とは別に、SEO記事は静的HTMLとして生成する構成。`main` への push で更新されるのは Web だけなので、アプリのコラムタブにも反映するには EAS Update の配信が別途必要（手順6）。リリース全般のルールは `docs/release-workflow.md`。

## コラム記事の目的（編集方針）

検索からの流入を作り、そこから LIMap のサービス本体（地図・スポット登録）へ送客することが目的。

- **ビッグワードの真正面では戦わない。** 「リミナルスペース とは」「8番出口 ロケ地」は Wikipedia や大手メディアが固めている。切り口をずらしてロングテールを面で取る。
- **必ず「実在スポット」に着地させる。** 概念解説だけの記事は競合と差がつかない。記事末尾で LIMap の登録スポットへ内部リンクを貼れる構成にする。
- **トレンドワードはフックとして使う。** 映画・ゲームの公開に合わせた記事で入口を作り、常設の概念記事・スポット記事へ内部リンクで流す。
- 事実関係が確認できない具体情報は書かない。書く必要がある場合は Shu に確認を求める。

## ⚠️ 記事を1本追加するときに触るファイルは「4箇所」

記事データが2系統に分かれているため、**1箇所でも漏れると症状が分かりにくい不具合になる**。

| # | ファイル | 役割 | 漏らすとどうなるか |
|---|---|---|---|
| 1 | `content/articles.json` | 記事本文（日英）。静的HTML生成の元データ | 記事ページ自体が生成されない |
| 2 | `src/lib/articles.ts` の `ARTICLE_ENTRIES` | **アプリ内コラムタブの一覧表示用**の軽量サマリー | URL直打ちでは読めるのに、**コラムタブの一覧に出てこない** |
| 3 | `api/sitemap.ts` の `ARTICLE_SLUGS` | sitemap.xml に載せるスラッグ一覧 | Googleにクロール候補として通知されない |
| 4 | `public/articles/`・`public/en/articles/`（英語版）と `public/llms.txt` | 生成物（手書きせず `npm run articles:build` で再生成） | ページが古いまま／AI向けの案内(llms.txt)に記事が載らない |

### 手順

1. `content/articles.json` に記事オブジェクトを追記
2. `src/lib/articles.ts` の `ARTICLE_ENTRIES` に `ArticleSummary` を追記（`content/articles.json` と同じ順序で）
3. `api/sitemap.ts` の `ARTICLE_SLUGS` にスラッグを追記
4. `npm run articles:build` を実行（= `node scripts/generate-articles.js`）
   → 日本語版 `public/articles/<slug>/index.html`・英語版 `public/en/articles/<slug>/index.html`（別URL。hreflang で結ぶ）、それぞれの記事一覧ハブ、AI向けのサイト案内 `public/llms.txt` が再生成される
5. `node scripts/check-articles.js` で4箇所の整合性を確認（OK が出ればよい）
6. `git add content/articles.json src/lib/articles.ts api/sitemap.ts public/articles public/en public/llms.txt` → commit → `git push origin main`
   → Vercel が自動デプロイ（**ここまでで反映されるのは Web のみ**）
7. **アプリ（iOS）にも反映する**
   ```bash
   npx eas-cli update --branch production --environment production --message "コラム記事『◯◯』を追加"
   ```
   - `--branch production` を必ず明示（`--auto` は git ブランチ名 `main` を使うため production チャンネルに届かない）
   - `app.json` の `version` は**絶対に触らない**（runtimeVersion が変わり、既存インストールに届かなくなる）
   - ユーザーの次回アプリ起動時に反映

push と `eas update` は実行前に Shu に確認を取る。

## 記事オブジェクトのスキーマ（`content/articles.json`）

```
{
  slug, category, categoryEn, publishedDate,   // publishedDate は "YYYY-MM-DD"
  updatedDate?,                                // 任意。本文を直したときの更新日 "YYYY-MM-DD"
  ja: { title, metaDescription, h1, lead, sections: [...] },
  en: { title, metaDescription, h1, lead, sections: [...] },
  images: [...]
}
```

- `sections[]` = `{ heading, paragraphs: string[], spots?: [...] }`
- `paragraphs` は生成時に HTML エスケープされるため、**本文中に `<a>` タグは書けない**。他記事への内部リンクは本文で言及するにとどめ、リンク自体はページ下部の関連記事ブロックが自動生成する。
- `spots[]` = `{ title, slug, afterParagraph, thumbnailUrl? }`
  - `slug` はSupabaseの実在スポットのスラッグ（例：`77BLLqk2` = カプセルイン大阪）。`https://limap.jp/spot/<slug>` へのカード型リンクになる。
  - `afterParagraph` は0始まりの段落index。その段落の直後にカードが挿入される。省略するとセクション末尾にまとめて表示。
  - `thumbnailUrl` が無い場合はピンアイコンのプレースホルダーになる。
  - **`ja` と `en` の両方に同じ `spots` を書くこと**（片方だけだと言語切替でカードが消える）。
- `images[]` = `{ file, author, license, licenseUrl, sourceUrl, altJa, altEn, captionJa, captionEn, afterSection }`
  - 画像は **Wikimedia Commons のファイル名**を指定し、`Special:FilePath` 経由で読み込まれる。ライセンス表記は自動出力されるので、`author` / `license` / `licenseUrl` / `sourceUrl` を正しく入れること。新しい画像は Commons のファイルページで author / license を確認してから入れる。
  - **既に他記事で使っているファイルを再利用する場合は、メタデータをそのままコピーする**（記憶で書くと著者名やライセンスを間違える）。
  - `afterSection: -1` がヒーロー画像（記事冒頭）。0以上はそのセクションの直後に挿入。
- `ja.faq` / `en.faq`（`{ q, a }` の配列、任意）は本文の末尾に「よくある質問」として表示され、日本語版は FAQPage の構造化データにもなる。**ページに出る内容なので、事実関係は本文と同じ基準で確認する**。
- `updatedDate`（`"YYYY-MM-DD"`、任意）：公開後に本文を直したときに入れる。記事の日付表示に「更新日」が出て、構造化データの `dateModified` になる。誤字の修正だけなら入れなくてよい。

## サマリーのスキーマ（`src/lib/articles.ts`）

```
{ slug, publishedDate, categoryJa, categoryEn, titleJa, titleEn, leadJa, leadEn, thumbnailFile }
```

- `thumbnailFile` は Commons のファイル名（`content/articles.json` のヒーロー画像と揃える）
- `leadJa` / `leadEn` はカード表示で2行に省略されるため、本文の `lead` より短い専用の文にする。

### 並び順

**記事一覧は `publishedDate` の降順（新着順）でソートされる。**

- アプリ側：`src/lib/articles.ts` で `ARTICLE_ENTRIES` を定義し、`export const ARTICLES` がそれをソートしたもの
- Web側：`scripts/generate-articles.js` の `main()` で読み込み直後に同じソートを適用（一覧ハブと関連記事ブロックの両方に効く）

`Array#sort` は安定なので、**同じ公開日の記事は配列に書いた順のまま**並ぶ。同日に複数本出すときは、上に出したい記事を配列の先頭側に置く。

## 注意点・ハマりどころ

- `content/articles.json` を `JSON.stringify(arr, null, 2)` で書き戻すと既存の1行表記（`spots` の各要素など）が展開されるため、diffが実際の変更より大きく見える。内容自体は変わらない。
- 公開済み記事の一覧は `content/articles.json` が正。カテゴリやスラッグの命名は既存記事に合わせる。

## 内部リンクに使える実在スポット（2026年9月6日時点）

最新の登録状況は Supabase の `spots` テーブルで確認すること。

| スポット | slug |
|---|---|
| 清澄白河駅の不気味な通路（8番出口のモデル地） | vbUQ9kcZ |
| 東京駅 京葉線・武蔵野線連絡通路 | KM5aKcco |
| 首都圏外郭放水路（地下神殿） | JsXsWk9W |
| 松代大本営 象山地下壕 | zphbsPDi |
| カプセルイン大阪（ニュージャパン梅田店） | 77BLLqk2 |
| 東成田駅（旧成田空港駅） | FGg4w6Jh |
| 旧野木病院（廃病院） | Ru5BLnja |
| コインスナック ジョイフル24 | nPuRMQQp |
| 桐ケ丘中央商店街 | V6z9Xx58 |
| 奥多摩湖ロープウェイ 川野駅跡 | gHBKZTqy |
| 神子畑選鉱場跡（東洋のマチュピチュ） | tZU5uY9m |
| 志摩マリンランド（廃墟） | m52bzS9d |
| 旧池島炭鉱 選炭工場跡 | ZKgQrh3z |

## 今後の記事候補（未着手）

- バックルームズのエンティティ（怪物）解説 — wiki ごとに設定が食い違い、一次情報が弱いため保留中
- 他の地方版の「◯◯のリミナルスペース」（関西 `liminal-spots-kansai`・名古屋 `liminal-spots-nagoya`・北海道 `liminal-spots-hokkaido`・九州 `liminal-spots-kyushu`・東北 `liminal-spots-tohoku`・中国四国 `liminal-spots-chugoku-shikoku`・北陸甲信越 `liminal-spots-hokuriku-koshinetsu`・沖縄 `liminal-spots-okinawa`・北関東 `liminal-spots-kitakanto`・静岡東海 `liminal-spots-tokai` は公開済み）
- 『Pools』『Escape the Backrooms』などゲーム側からの流入記事
- 映画『バックルームズ』のネタバレ考察 — 書くなら Shu が実際に観てから
