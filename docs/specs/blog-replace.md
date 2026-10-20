# ブログ リプレイス 指示書

対象リポジトリ: `tkc310/astro-blog`
移行元: [`tkc310/microCMS_blog`](https://github.com/tkc310/microCMS_blog)（microCMS + Next.js 12）

判断の理由は ADR（[`docs/decisions/`](../decisions/README.md)）、守る規則は [`rules/`](../../rules/) にある。この指示書は「何を作るか」をまとめる。

---

## 0. 目的

1. Core Web Vitals を上げる（目標: LCP < 2.5s、CLS < 0.1、INP < 200ms。いずれも 75 パーセンタイル）
2. JSON-LD で SEO と AIO を上げる
3. Cloudflare と Astro・Vite+ のキャッチアップ

## 1. 技術スタック

| レイヤー         | 使うもの                                                                                                                      | ADR  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---- |
| フレームワーク   | Astro 7（`output: 'static'`。`/about` だけ Worker で描く、ADR-0017）                                                          | 0001 |
| コンテンツ       | Markdown + Content Collections（`glob` ローダー、Zod スキーマ）                                                               | 0002 |
| ツールチェーン   | Vite+（`vp`：Oxfmt・Oxlint・Vitest・タスク実行）                                                                              | 0003 |
| CMS              | Sveltia CMS（`/admin/`）＋ `sveltia-cms-auth`（Cloudflare Worker）                                                            | 0004 |
| 配信・プレビュー | Cloudflare Workers の静的アセット ＋ Workers Builds。`/about` は Astro の Cloudflare アダプターとルートキャッシュ（ADR-0017） | 0005 |
| URL              | 旧 URL を保つ（`/articles/<id>`、末尾スラッシュなし）                                                                         | 0006 |
| UI               | Astro コンポーネント ＋ scoped CSS（UI フレームワークなし）                                                                   | 0007 |
| デザイン         | 白地のシンプルなデザイン（[`design.md`](./design.md)）                                                                        | 0016 |
| Markdown         | `unified()` ＋ remark-link-card-plus ＋ Expressive Code                                                                       | 0008 |
| 計測             | Cloudflare Web Analytics                                                                                                      | 0005 |

## 2. 機能

| 機能                        | 対応     | 備考                                                                                                                                             |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 記事一覧（トップ `/`）      | 作る     | 新しい順に、年でまとめずに日付（`2026.10.19`）付きで並べる。ページ送りあり（1 ページの件数は旧ブログの設定に合わせる）。`/articles` はここへ 301 |
| 記事詳細                    | 作る     | 目次、リンクカード、コードブロックの装飾                                                                                                         |
| カテゴリ別一覧              | 作る     | 1 記事 1 カテゴリ。カテゴリの色を表示に使う                                                                                                      |
| 私について（`/about`）      | 作る     | 自己 PR、目次（記事詳細と同じ）、LAPRAS の活動一覧（ADR-0017）。記事の一覧は置かない。Worker で描いてキャッシュする                              |
| 下書き                      | 作る     | `draft: true`。本番ビルドでは除き、プレビューでだけ出す。microCMS の下書きも移す                                                                 |
| 読了時間・ライセンス表示    | 作らない |                                                                                                                                                  |
| RSS・サイトマップ・llms.txt | 作る     | ビルド時に作る                                                                                                                                   |
| 404                         | 作る     | 静的な `404.html`                                                                                                                                |
| タグ                        | 作らない | 旧 URL は 301（ADR-0006）                                                                                                                        |
| ノート・寄付・認証          | 作らない | 旧 URL は 301                                                                                                                                    |
| MDX                         | 使わない |                                                                                                                                                  |
| 記事ごとのアイキャッチ      | 使わない | OGP 画像はサイト共通の 1 枚                                                                                                                      |
| 検索                        | 後で     | 足すなら Pagefind を検索ページだけで読み込む                                                                                                     |

## 3. コンテンツモデル

### 記事（`src/content/posts/<id>.md`）

| frontmatter   | 型                        | 必須 | 用途                                 |
| ------------- | ------------------------- | ---- | ------------------------------------ |
| `title`       | string                    | ○    | タイトル、OGP、JSON-LD の `headline` |
| `description` | string                    | ○    | meta description、OGP、一覧の抜粋    |
| `pubDate`     | date                      | ○    | `datePublished`                      |
| `updatedDate` | date                      |      | `dateModified`（無ければ `pubDate`） |
| `category`    | `reference('categories')` | ○    | カテゴリページ、パンくず             |
| `draft`       | boolean（既定 `false`）   |      | 下書き                               |

ファイル名（拡張子を除く）が URL の `<id>` になる。

### カテゴリ（`src/content/categories/<slug>.yml`）

| 項目          | 型     | 必須 | 用途                                  |
| ------------- | ------ | ---- | ------------------------------------- |
| `name`        | string | ○    | 表示名                                |
| `color`       | enum   | ○    | 旧ブログの色（blue・green・red など） |
| `description` | string |      | カテゴリページの説明                  |

### サイト設定（`src/site.config.ts`）

サイト名・説明・URL・1 ページの件数・作者（名前・各 SNS のアカウント・自己紹介）。About ページと JSON-LD の `author`・`publisher` に使う。

## 4. ルーティング

| パス                          | 内容                               |
| ----------------------------- | ---------------------------------- |
| `/`                           | 記事一覧の 1 ページ目              |
| `/about`                      | 私について                         |
| `/articles/page/<n>`          | 記事一覧の n ページ目              |
| `/articles/<id>`              | 記事詳細                           |
| `/articles/categories/<slug>` | カテゴリ別一覧                     |
| `/rss/feed.xml`               | RSS                                |
| `/sitemap-index.xml`          | サイトマップ（`@astrojs/sitemap`） |
| `/llms.txt`                   | 記事のタイトル・URL・概要の一覧    |
| `/admin/`                     | Sveltia CMS（`noindex`）           |

旧 URL からのリダイレクトは ADR-0006 の表に従い `public/_redirects` に書く。`/articles` と `/articles/page/1` は `/` へ 301 する。

## 5. 記事詳細

- **目次**: h2・h3 から作る。PC は横に固定、モバイルは本文の前に `<details>` で畳み sticky で追尾する（閉じているときは今の見出し名も出す）。現在位置の強調は IntersectionObserver の小さなスクリプトで行う
- **見出し**: 各見出しに `id` を付け、レベルに応じた `##` / `###` を前に出す（題名の h1 には付けない）。クリックでその見出しへページ内で移動する
- **リンクカード**: URL だけの行をカードにする（`rules/content.md`）。ビルド時に OGP を取り、画像とファビコンは `public/remark-link-card-plus/` に保存して自分のサイトから出す（コミットしない）。カードのサムネイルはビルドで幅 480px の WebP に縮めて出す。保存は本文を描くときだけなので、ビルドは `astro build --force` で Astro のキャッシュを捨てて回す（Workers Builds はキャッシュを戻してからビルドする）。サムネイルの枠は大きさを固定する。OGP が取れないときは普通のリンクにする
- **コードブロック**: Expressive Code（`github-light`、枠と影なし、地は `--wash`）。言語名・ファイル名・行の強調・コピーボタン
- **画像**: `astro:assets` で最適化し、`width`・`height` を必ず出す。最初の画像以外は `loading="lazy"`
- **外部リンク**: `target="_blank" rel="noopener noreferrer"`

## 6. About

- **自己 PR**: コンテンツ `profile`（`src/content/profile/about.md`。Markdown、見出しは `##` から、frontmatter は `updatedDate` だけ）を差し込む。ページの題は「私について」で、上に名前、下にサイト設定の一言（`author.description`）。Sveltia CMS の PR で、このファイルも編集できるようにする
- **目次**: 記事詳細と同じ `WithToc`。自己 PR の h2・h3 に加え、ページ下部の「最近の活動」も含める
- **区切り**: 自己 PR と最近の活動のあいだは、線と広い余白で分ける
- **LAPRAS の活動一覧**（ADR-0017。ブラウザからは CORS で取れないため、ADR-0012 から変えた）
  - 自己 PR の下に置く
  - `/about` を Worker で描くときに、サーバから `https://lapras.com/public/<share_id>.json` を取り、`activities` を新しい順に 10 件出す（日付・種類・タイトルのリンク）。3 秒で打ち切る
  - 取れなかったときは、LAPRAS のプロフィールへのリンクだけを出す
  - 本番は Cloudflare にキャッシュする（取れたら 1 時間＋裏での描き直し 1 日、取れなかったら 5 分）。開発中は毎回描く
  - クライアント JS は使わない

## 7. SEO・構造化データ

JSON-LD はできるだけリッチにする（ADR-0011）。1 ページに 1 つの `@graph` を出し、サイト共通の `WebSite`・`Blog`・`Person` を固定の `@id` で結ぶ。

| ページ                 | `@graph` に入れるノード                                               |
| ---------------------- | --------------------------------------------------------------------- |
| 記事詳細               | `WebPage` ＋ `BlogPosting` ＋ `BreadcrumbList` ＋ 共通の 3 ノード     |
| 記事一覧               | `CollectionPage` ＋ `ItemList` ＋ 共通の 3 ノード                     |
| カテゴリ               | `CollectionPage` ＋ `ItemList` ＋ `BreadcrumbList` ＋ 共通の 3 ノード |
| 私について（`/about`） | `ProfilePage`（`mainEntity` → `Person`）＋ 共通の 3 ノード            |

- `BlogPosting` には、日付・作者・画像・カテゴリ・文字数に加え、本文のコードブロックを `hasPart`（`SoftwareSourceCode`）、リンクカードと外部リンクを `citation` として入れる
- `Person` は全記事の `author` と `publisher` を兼ね、`sameAs` に GitHub・X・Zenn・Qiita・LAPRAS を入れる。各 SNS へのリンクは共通のフッターに表示する（画面に無いことは JSON-LD に書かないため）
- 出さない項目: 読了時間とライセンスは表示しないので `timeRequired`・`license`、About に肩書や得意分野の欄が無いので `jobTitle`・`knowsAbout`、LAPRAS の活動一覧（このサイトの著作物ではなく、キャッシュの間に変わる）
- 項目の一覧は [`rules/seo.md`](../../rules/seo.md)。組み立ては `src/lib/jsonld/` にまとめ、ページの種類ごとにテストで形を固定する

## 8. 受け入れ基準

- 旧ブログの全記事が `/articles/<id>` で 200 を返し、旧 URL の一覧がすべて 200 か 301 を返す
- クライアント JS が、目次の現在位置の強調・見出しのクリックでのページ内の移動・コードのコピーボタンの分だけである
- `/about` は LAPRAS が止まっていても 3 秒ほどで返り、キャッシュが効いている間は LAPRAS を呼ばない
- すべてのページの JSON-LD が `rules/seo.md` の表のノードと項目をそろえ、Google のリッチリザルト テストと Schema.org Validator で警告が出ない
- Lighthouse（モバイル）で性能・アクセシビリティ・ベストプラクティス・SEO が 100 点（ADR-0021）
- Web Analytics で、切り替え後の LCP・CLS・INP が旧サイトより悪くない

## 9. 進め方

1. 雛形（Astro 7 ＋ Vite+、Workers へのデプロイ、プレビュー）と、バックログの「雛形」の確認
2. レイアウト・記事一覧・記事詳細・カテゴリ・About
3. Markdown の拡張（リンクカード・Expressive Code・目次）
4. SEO（メタタグ・JSON-LD・RSS・サイトマップ・llms.txt）
5. Sveltia CMS と認証の Worker
6. microCMS からの移行（[`microcms-migration.md`](./microcms-migration.md)）
7. 検査（出力の検査・旧 URL・Lighthouse CI）と本番の切り替え
