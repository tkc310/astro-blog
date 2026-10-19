---
name: write-post
description: ブログの記事を書く・直す・移行した記事を整えるときに使う。「記事を書いて」「この記事を直して」「移行した記事の要対応を片付けて」と頼まれたときに使う。rules/content.md に沿った Markdown を作り、プレビューで確かめて PR にする。
---

# 記事を書く

記事の形式は [`rules/content.md`](../../../rules/content.md) が正本。このスキルは手順だけを書く。

## 手順

1. **ブランチを切る**: `post/<id>`（例: `post/astro-7-upgrade`）
2. **ファイルを作る**: `src/content/posts/<id>.md`。`<id>` は英小文字・数字・`-` で、公開後は変えない
3. **frontmatter を書く**
   ```yaml
   ---
   title: 記事のタイトル
   description: 記事の要点を 1〜2 文、120 字前後で
   pubDate: 2026-10-19
   category: frontend
   draft: true
   ---
   ```
   - `category` は `src/content/categories/` のファイル名から選ぶ。無ければ新しいカテゴリを足すか、人に聞く
4. **本文を書く**
   - 見出しは `##` から。h2・h3 が目次になる
   - リンクカードにしたい URL は、前後を空行で挟んで 1 行に書く
   - 画像は `src/assets/posts/<id>/` に置き、`alt` を書く
   - コードブロックには言語名を付け、必要ならファイル名（`title="..."`）を付ける
5. **確かめる**
   - `vp run build` が通る（スキーマの検査）
   - PR のプレビュー URL で、目次・リンクカード・コード・画像の表示を見る
6. **公開する**: `draft: true` を外し、`post` の type でコミットして PR をマージする

## 移行した記事を整えるとき

`vp run migrate` の報告に出た要対応を片付ける。

- JSX のコンポーネントが残る記事: Markdown で同じ意味に書き換え、`draft: true` を外す
- 自動で作った `description`: 要点を表す文に書き直す
- `alt` の無い画像、言語名の無いコードブロック: 埋める

## やってはいけないこと

- 公開済みの記事の `<id>` を変える（変えるなら `_redirects` に 301 を足し、人の承認を得る）
- MDX や HTML のタグで表示を作る
- 本文に外部の画像の URL を直接書く
