# 0008 Markdown の処理系を `unified()` にし、リンクカードと Expressive Code を使う

- 日付: 2026-10-19
- 状態: 採用

## 背景

Astro 7 から、Markdown の既定の処理系は Rust 製の Sätteri になった。remark/rehype のプラグインを使うには、`@astrojs/markdown-remark` を入れて `markdown.processor: unified()` に切り替える必要がある。

旧ブログには次の表現があり、新しいブログでも残したい。

- URL だけの行を、タイトル・説明・画像付きのリンクカードにする（旧ブログは表示後に `/api/meta` で OGP を取りに行っていた）
- コードブロックのハイライト

## 決定

- `markdown.processor: unified()` にする
- リンクカードは remark-link-card-plus（検討時点 0.8.1）で、ビルド時に OGP を取得して HTML に埋め込む。画像はキャッシュしてローカルから出す
- コードブロックは Expressive Code（`astro-expressive-code`、検討時点 0.44.2、Astro 7 に対応）で、ファイル名・行の強調・コピーボタンを付ける
- 外部リンクの `target="_blank"` と `rel` は rehype-external-links で付ける

## 理由

- リンクカードをビルド時に埋め込めば、表示後にレイアウトがずれない（CLS が下がる）
- Expressive Code はハイライトをビルド時に行い、クライアント JS はコピーボタンの分だけで済む
- 自前で Sätteri 用のプラグインを書くより、実績のあるプラグインを使う方が早い

## 影響・トレードオフ

- Sätteri より遅い処理系に留まる。記事数が数百ならビルド時間の差は小さい
- ビルドのたびに外部サイトへ OGP を取りに行く。取得できないときはビルドを止めず、普通のリンクとして出す
- 2 つのプラグインが `unified()` で一緒に動くかは雛形で確かめる（バックログ）。Sätteri 用のプラグインが育ったら、この ADR を見直す
