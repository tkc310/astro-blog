# 0010 microCMS からの移行は一度きりのスクリプトで行い、画像もリポジトリに移す

- 日付: 2026-10-19
- 状態: 採用（データの取り方は ADR-0018 で変えた）

## 背景

旧ブログの記事は microCMS の `articles` API にあり、本文は MDX のテキスト（テキストエリア「本文 (MDX)」）。カテゴリは `categories`、サイトの設定とプロフィールは `configs` にある。本文中の画像は `images.microcms-assets.io` に置かれている。

## 決定

- 移行は一度きりのスクリプト（`scripts/migrate-microcms.ts`、`make migrate` で実行）で行い、結果の Markdown と画像をコミットする
- 記事・カテゴリ・プロフィールを移す。一度も公開していない下書きの記事も `draft: true` で移す。タグ、アイキャッチ画像、ノート、寄付の設定は移さない
- 本番のドメインは Cloudflare の DNS で新しい Worker に切り替え、その後に microCMS の Webhook を止めて、Vercel の旧サイトを消す
- 本文中の画像はダウンロードしてリポジトリに置き、microCMS への依存を残さない
- MDX のコンポーネントは自動で直さず、一覧に出して手で Markdown に書き換える
- 移行が終わり本番を切り替えたら、スクリプトを消し、microCMS の契約を止める

詳細な手順は [`docs/specs/microcms-migration.md`](../specs/microcms-migration.md)。

## 理由

- 本文がもともと Markdown に近い MDX なので、HTML からの変換は要らず、写すだけでほぼ済む
- 一度きりなので、同期の仕組みを作るより、結果を Git で確かめてコミットする方が安全
- 画像を microCMS に残すと、契約を止めた時点で画像が消える

## 影響・トレードオフ

- 移行してから本番を切り替えるまでの間に microCMS で記事を書くと、取りこぼす。切り替えまでは記事を書かない（または移行を再実行する）
- microCMS の API キーは `.env` にだけ置き、コミットしない
