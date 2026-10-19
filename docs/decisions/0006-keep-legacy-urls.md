# 0006 旧ブログの URL（`/articles/<id>`、末尾スラッシュなし）を保つ

- 日付: 2026-10-19
- 状態: 採用

## 背景

旧ブログ（Next.js）の URL は次のとおりで、末尾にスラッシュが付かない。検索エンジンの評価、外部からのリンク、RSS の購読者がこれらの URL に付いている。

- 記事: `/articles/<microCMS の ID>`
- 一覧: `/`、`/articles/page/<n>`、`/articles/categories/<slug>`、`/articles/tags/<slug>`
- その他: `/about`、`/notes/*`、`/donation`、`/auth/signin`、`/preview/*`
- フィード: `/rss/feed.xml`、`/rss/atom.xml`、`/rss/feed.json`、サイトマップ: `/sitemap.xml`

## 決定

- 記事のファイル名に microCMS の ID を使い（`src/content/posts/<id>.md`）、`/articles/<id>` をそのまま保つ
- 一覧・カテゴリ・ページ送り・About・RSS（`/rss/feed.xml`）の URL も保つ
- 末尾スラッシュは付けない。Astro は `trailingSlash: 'never'` と `build.format: 'file'` にし、`/articles/<id>.html` を出す。Workers の `html_handling` は既定（`auto-trailing-slash`）のままにし、`/articles/<id>` を 200 で返す
- 無くすページは `_redirects` で 301 にする

| 旧 URL                               | 新しい扱い                 |
| ------------------------------------ | -------------------------- |
| `/articles/tags/*`                   | `/` へ 301（タグは廃止）   |
| `/notes`、`/notes/*`                 | `/` へ 301（ノートは廃止） |
| `/donation`、`/auth/*`、`/preview/*` | `/` へ 301                 |
| `/rss/atom.xml`、`/rss/feed.json`    | `/rss/feed.xml` へ 301     |
| `/sitemap.xml`                       | 新しいサイトマップへ 301   |

## 理由

- 記事の URL が変わらなければ、記事のリダイレクトが要らず、検索の評価も外部リンクもそのまま残る
- `build.format: 'file'` なら、末尾スラッシュなしの URL をリダイレクトなしで返せる。リダイレクトが挟まると LCP が遅れる

## 影響・トレードオフ

- 記事の URL が意味の無い ID になる。新しく書く記事も同じ形（英小文字・数字・`-` の ID）にする（`rules/content.md`）
- `build.format: 'file'` と Workers の組み合わせで 200 が返るかは、雛形で確かめる（バックログ）
- 旧 URL の一覧を作り、移行後に 200 か 301 で返るかを CI で確かめる（ADR-0010）
