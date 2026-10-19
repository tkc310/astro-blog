# microCMS からの移行 指示書

移行元: [`tkc310/microCMS_blog`](https://github.com/tkc310/microCMS_blog) と microCMS のサービス `tkc310`
方針: [ADR-0010](../decisions/0010-microcms-migration.md)・[ADR-0018](../decisions/0018-migrate-from-public-pages.md)（データは公開ページの `__NEXT_DATA__` から取る）、URL: [ADR-0006](../decisions/0006-keep-legacy-urls.md)

---

## 0. 移行元のデータ

旧リポジトリの `config/schema/` と `src/types/index.d.ts` で確かめた形。

| API                  | 主な項目                                                                                                  | 移すか                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ |
| `articles`           | `id`・`title`・`excerpt`・`body`（MDX のテキスト）・`category`・`tags`・`image`・`imageOption`・日付 4 種 | 移す（一部の項目を除く） |
| `categories`         | `id`・`name`・`slug`・`color`                                                                             | 移す                     |
| `configs`            | `perPage`・`host`・サイト名・説明・キーワード・`siteImage`・`profile`・`donations`                        | 一部を移す               |
| `tags`               | タグ                                                                                                      | 移さない                 |
| `notes`・`note_tags` | ノート                                                                                                    | 移さない                 |

## 1. 項目の対応

### 記事

| microCMS                       | 新しいブログ                                                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| `id`                           | ファイル名 `src/content/posts/<id>.md`（URL の `<id>`）                    |
| `title`                        | `title`                                                                    |
| `excerpt`                      | `description`。空なら本文の先頭から 120 字程度を作り、一覧に出して確かめる |
| `publishedAt`                  | `pubDate`                                                                  |
| `revisedAt`                    | `updatedDate`（`publishedAt` と同じ日なら書かない）                        |
| `category.slug`                | `category`（カテゴリのファイル名）                                         |
| `body`                         | 本文（§2 の変換をかける）                                                  |
| `tags`・`image`・`imageOption` | 捨てる                                                                     |

### 下書きの記事

公開ページから取るので（ADR-0018）、microCMS で一度も公開していない記事は移らない。要るものは管理画面から手で移し、`draft: true` を付ける。公開済みの記事は、公開中の版を移す。

### カテゴリ

`src/content/categories/<slug>.yml` に `name`・`color` を書く。旧ブログのカテゴリには色が入っていない（空の配列）ので、スクリプトの `CATEGORY_COLORS` で決める（tech: blue・lifehack: green・book_review: orange・occult: purple・etc: gray）。`book_review` の `_` は旧 URL を保つために残す。

### 設定

`configs` の `siteTitle`・`siteDescription`・`host`・`perPage` と `profile`（名前・フルネーム・自己紹介・自己 PR・各 SNS のアカウント）を `src/site.config.ts` に写す（自己 PR は `src/content/profile/about.md` に Markdown で書く）。`siteImage` はダウンロードして既定の OGP 画像にする。`donations` は捨てる。

## 2. 本文の変換

旧ブログは描画の前に本文を書き換えていた（`src/utils/mdx2html.ts`）。同じ意味になるよう、移行時に Markdown を直す。

| 旧ブログでの書き方                              | 旧ブログでの表示                | 移行後                                                                  |
| ----------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `[テキスト](https://...)`                       | 別タブで開くリンク              | そのまま（rehype-external-links が別タブにする）                        |
| `<https://...>` が 1 行だけ                     | 実行時に OGP を取るリンクカード | URL だけの行に直す（ビルド時にリンクカードになる）                      |
| `![alt](https://images.microcms-assets.io/...)` | 画像                            | 画像をダウンロードし、相対パスに直す（§3）                              |
| `<img src="..." alt="..." />`                   | 画像                            | `![alt](...)` に直し、上と同じく相対パスにする                          |
| JSX のコンポーネント（例: `<PhoneIcon />`）     | React の部品                    | 自動では直さない。一覧に出し、手で Markdown に直す                      |
| コードブロック                                  | Prism でハイライト              | そのまま（Expressive Code）。言語名の無いものは `text` にして一覧に出す |
| 本文中の `# 見出し`（h1）                       | h1                              | 全体を 1 段下げる（ページの h1 はタイトルだけ）。飛ばしたレベルも詰める |
| 200 字を超える・改行を含む抜粋                  | 一覧の抜粋                      | 1 行にし、200 字までの最後の「。」で切る                                |

コードの外に JSX の要素（大文字で始まるタグ）・`import`・`export` が残っている記事を一覧に出す。手で直すまで、その記事は `draft: true` にしておく。

## 3. 画像

1. 本文の画像の URL のうち `images.microcms-assets.io` のものを集める
2. `src/assets/posts/<id>/<元のファイル名>` にダウンロードする（URL のクエリは外す）
3. 本文のパスを `../../assets/posts/<id>/<ファイル名>` に書き換える
4. `alt` が空の画像を一覧に出す（手で埋める）

## 4. スクリプト

- 置き場所: `scripts/migrate-legacy.ts`（変換の関数は `scripts/migrate-legacy.test.ts` で確かめる）。実行: `make migrate`
- `https://tkc310.com` のトップと `/articles/page/<n>` の一覧から記事の ID を集め、各記事のページの `__NEXT_DATA__` を読む。API キーは使わない
- 何度実行しても同じ結果になる（`src/content/posts/`・`src/content/categories/`・`src/assets/posts/` を消してから書く）
- 最後に報告を出す: 公開記事数・下書き数・カテゴリ数・画像数、要対応の一覧（JSX が残る記事、`description` を作った・縮めた記事、言語名の無いコードブロック、見出しを直した記事、`alt` の無い画像、取得に失敗した画像）

### 2026-10-19 の実行結果

公開記事 15 本・下書き 1 本・カテゴリ 5 個・画像 12 枚。要対応は 1 件だけ。

- `g8crnjuuxpgt`（テスト用の記事）: `<PhoneIcon />` が残るので `draft: true`。旧 URL は `/` へ 301 にした。要らなければ消す

## 5. 確かめること

- [x] 公開記事数が旧サイトの一覧と一致する（16 本。うち 1 本はテスト用で下書き）
- [ ] 本番ビルドに下書きが出ず、プレビュー URL にだけ出る
- [x] `make build` が通る（Zod スキーマの検査を含む）
- [ ] 旧サイトのサイトマップの URL がすべて、新しいサイトで 200 か 301 を返す
- [x] 本文中の内部リンク（`/articles/...`）が切れていない（本文に内部リンクは無かった）
- [ ] 要対応の一覧をすべて片付けた
- [ ] 目視で、画像・コード・リンクカードの多い記事を 5 本ほどプレビュー URL で見比べる

## 6. 切り替え

本番のドメインは旧サイトと同じものを使い、Cloudflare の DNS で切り替える。

1. 移行を実行して PR を出し、プレビュー URL で確かめてマージする
2. 切り替えの直前に `make migrate` をもう一度実行し、差分が無いことを確かめる（移行のあとに microCMS で書いた記事を取りこぼさないため）。旧サイトを消すと再実行できない（ADR-0018）
3. Cloudflare で本番のドメインを新しい Worker のカスタムドメインにし、Vercel を向いていた DNS のレコードを置き換える
4. 本番のドメインで、旧 URL の一覧が 200 か 301 を返すことを確かめる
5. microCMS の Webhook（記事の更新で Vercel のビルドを走らせるもの）を止める
6. Vercel のプロジェクト（旧サイトのホスティング）を消す
7. Search Console にサイトマップを出し直し、カバレッジの変化を 2 週間ほど見る
8. 問題が無ければ、移行スクリプトを消し、microCMS の契約を止める

切り替えの日は、移行の PR をマージしてから決める。手順 3 の後に問題が出たら、手順 6 の前であれば DNS のレコードを Vercel に戻せる。
