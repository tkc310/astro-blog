# 記事の規則

記事は `src/content/posts/<id>.md` に置く。`<id>` は英小文字・数字・`-` だけで書き、公開したら変えない（URL になる）。MDX は使わない。

frontmatter は `title`・`description`・`pubDate`・`category` が必須で、`updatedDate`・`draft` を任意で書く。それ以外の項目は書かない。項目を足すときは、Astro の Zod スキーマ（`src/content.config.ts`）と Sveltia CMS の設定（`public/admin/config.yml`）の両方を直し、`docs/specs/blog-replace.md` の表も直す。

`description` は 120 字前後で、記事の要点を 1〜2 文で書く。検索結果と AI の要約に使われる。`category` は `src/content/categories/` にあるカテゴリのファイル名だ。中身を大きく直したら `updatedDate` を更新する。誤字の修正だけなら更新しない。

本文の見出しは `##`（h2）から始める。`#`（h1）はページのタイトルだけだ。見出しを飛ばさない（h2 の次に h4 を置かない）。目次は h2 と h3 から作られる。

リンクカードにしたい URL は、前後を空行で挟み、URL だけを 1 行に書く。文中のリンクは `[テキスト](URL)` で書き、リンクカードにはならない。箇条書きの中の URL もリンクカードにならない。

画像は `src/assets/posts/<id>/` に置き、本文から相対パスで参照する。`alt` を必ず書く。外部の URL の画像を本文に直接書かない。

コードブロックには言語名を付ける（例: ` ```ts `）。ファイル名を出すときは ` ```ts title="src/foo.ts" ` のように書く。

公開前の記事は `draft: true` にする。下書きは本番に出ず、プレビュー URL にだけ出る。
