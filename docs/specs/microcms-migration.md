# microCMS からの移行 指示書

移行元: [`tkc310/microCMS_blog`](https://github.com/tkc310/microCMS_blog) と microCMS のサービス `tkc310`
方針: [ADR-0010](../decisions/0010-microcms-migration.md)、URL: [ADR-0006](../decisions/0006-keep-legacy-urls.md)

---

## 0. 移行元のデータ

旧リポジトリの `config/schema/` と `src/types/index.d.ts` で確かめた形。

| API          | 主な項目                                                                                              | 移すか                 |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------------------- |
| `articles`   | `id`・`title`・`excerpt`・`body`（MDX のテキスト）・`category`・`tags`・`image`・`imageOption`・日付 4 種 | 移す（一部の項目を除く） |
| `categories` | `id`・`name`・`slug`・`color`                                                                         | 移す                   |
| `configs`    | `perPage`・`host`・サイト名・説明・キーワード・`siteImage`・`profile`・`donations`                    | 一部を移す             |
| `tags`       | タグ                                                                                                  | 移さない               |
| `notes`・`note_tags` | ノート                                                                                        | 移さない               |

## 1. 項目の対応

### 記事

| microCMS                    | 新しいブログ                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `id`                        | ファイル名 `src/content/posts/<id>.md`（URL の `<id>`）              |
| `title`                     | `title`                                                              |
| `excerpt`                   | `description`。空なら本文の先頭から 120 字程度を作り、一覧に出して確かめる |
| `publishedAt`               | `pubDate`                                                            |
| `revisedAt`                 | `updatedDate`（`publishedAt` と同じ日なら書かない）                  |
| `category.slug`             | `category`（カテゴリのファイル名）                                   |
| `body`                      | 本文（§2 の変換をかける）                                            |
| `tags`・`image`・`imageOption` | 捨てる                                                            |

### カテゴリ

`src/content/categories/<slug>.yml` に `name`・`color` を書く。

### 設定

`configs` の `siteTitle`・`siteDescription`・`host`・`perPage` と `profile`（名前・フルネーム・自己紹介・自己 PR・各 SNS のアカウント）を `src/site.config.ts` に写す。`siteImage` はダウンロードして既定の OGP 画像にする。`donations` は捨てる。

## 2. 本文の変換

旧ブログは描画の前に本文を書き換えていた（`src/utils/mdx2html.ts`）。同じ意味になるよう、移行時に Markdown を直す。

| 旧ブログでの書き方                     | 旧ブログでの表示             | 移行後                                             |
| -------------------------------------- | ---------------------------- | -------------------------------------------------- |
| `[テキスト](https://...)`              | 別タブで開くリンク           | そのまま（rehype-external-links が別タブにする）   |
| `<https://...>` が 1 行だけ            | 実行時に OGP を取るリンクカード | URL だけの行に直す（ビルド時にリンクカードになる） |
| `![alt](https://images.microcms-assets.io/...)` | 画像               | 画像をダウンロードし、相対パスに直す（§3）         |
| JSX のコンポーネント（例: `<PhoneIcon />`） | React の部品            | 自動では直さない。一覧に出し、手で Markdown に直す |
| コードブロック                         | Prism でハイライト           | そのまま（Expressive Code）。言語名の無いものを一覧に出す |
| 本文中の `# 見出し`（h1）              | h1                           | h2 に下げる（ページの h1 はタイトルだけ）          |

本文を MDX として構文解析し（`remark-mdx`）、JSX の要素・式・`import` が残っている記事を一覧に出す。手で直すまで、その記事は `draft: true` にしておく。

## 3. 画像

1. 本文の画像の URL のうち `images.microcms-assets.io` のものを集める
2. `src/assets/posts/<id>/<元のファイル名>` にダウンロードする（URL のクエリは外す）
3. 本文のパスを `../../assets/posts/<id>/<ファイル名>` に書き換える
4. `alt` が空の画像を一覧に出す（手で埋める）

## 4. スクリプト

- 置き場所: `scripts/migrate-microcms.ts`。実行: `vp run migrate`
- `.env` の `MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を読む（コミットしない）
- 何度実行しても同じ結果になる（出力先を消してから書く）
- 最後に報告を出す: 記事数・カテゴリ数・画像数、要対応の一覧（JSX が残る記事、`description` を作った記事、`alt` の無い画像、言語名の無いコードブロック、取得に失敗した画像）

## 5. 確かめること

- [ ] 記事数が microCMS の公開記事数と一致する
- [ ] `vp run build` が通る（Zod スキーマの検査を含む）
- [ ] 旧サイトのサイトマップの URL がすべて、新しいサイトで 200 か 301 を返す
- [ ] 本文中の内部リンク（`/articles/...`）が切れていない
- [ ] 要対応の一覧をすべて片付けた
- [ ] 目視で、画像・コード・リンクカードの多い記事を 5 本ほどプレビュー URL で見比べる

## 6. 切り替え

1. 移行を実行して PR を出し、プレビュー URL で確かめてマージする
2. 本番のドメインを新しい Worker に向ける（ドメインと日付はバックログで決める）
3. Search Console にサイトマップを出し直し、カバレッジの変化を 2 週間ほど見る
4. 問題が無ければ、移行スクリプトを消し、microCMS の契約と旧サイトを止める

## 未決

- microCMS の下書き記事を移すか（バックログ）
- About に旧ブログの LAPRAS の活動一覧を載せるか（ビルド時に取得するか、やめるか）
