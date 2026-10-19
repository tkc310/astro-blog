# 0002 記事はリポジトリの Markdown を正本にし、MDX は使わない

- 日付: 2026-10-19
- 状態: 採用

## 背景

旧ブログは記事を microCMS に置き、本文を MDX のテキストとして書いていた。描画は `next-mdx-remote` で行い、MDX のコンポーネント（例: `PhoneIcon`）も使えた。

## 決定

- 記事は `src/content/posts/<id>.md`、カテゴリは `src/content/categories/` に置き、Git のリポジトリを正本にする
- Content Collections（`glob` ローダー）で読み、frontmatter は Zod のスキーマで検査する
- MDX は使わない。本文で使えるのは Markdown（GFM）と、ADR-0008 で決めた拡張（リンクカード、コードブロックの装飾）だけ
- 外部の CMS・データベースは置かない

## 理由

- 記事の履歴・レビュー・プレビューが Git と PR の流れに乗り、AI エージェントも記事を読み書きできる
- MDX をやめると、本文に任意のコンポーネントが入らず、表示と構造化データの品質を規則で保ちやすい
- 外部 API に依存しないので、ビルドが速く、microCMS の契約も要らなくなる

## 影響・トレードオフ

- 非エンジニアが書くには管理画面が要る（ADR-0004 の Sveltia CMS で補う）
- 旧記事の MDX のコンポーネントは、移行時に Markdown へ書き換える（ADR-0010）
- 記事の形式の規則は [`rules/content.md`](../../rules/content.md)
