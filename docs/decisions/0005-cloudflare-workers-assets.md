# 0005 Cloudflare Workers の静的アセットで配信し、プレビューは Workers Builds のブランチ URL

- 日付: 2026-10-19
- 状態: 一部廃止（→ 0017）

> 私について（`/about`）だけは Astro の Cloudflare アダプターで Worker に描かせ、Cloudflare にキャッシュする（ADR-0017）。ほかのページは静的アセットのまま。

## 背景

旧ブログは Next.js の SSG と API ルート（OGP の取得、画像サイズの取得、プレビュー）を使っていた。新しいブログは静的ファイルだけで成り立つ。

## 決定

- ビルドした `dist/` を Cloudflare Workers の静的アセット（`wrangler.jsonc` の `assets.directory`）で配信する。Astro の Cloudflare アダプターは使わない
- GitHub と Workers Builds をつなぎ、`main` は本番、それ以外のブランチはブランチのプレビュー URL にデプロイする
- 計測は Cloudflare Web Analytics で行う。旧ブログの Google Tag Manager は入れない
- リダイレクトは `_redirects`、キャッシュとセキュリティのヘッダーは `_headers` に書く
- プレビュー URL と `/admin/` は、必要になったら Cloudflare Access で守る

## 理由

- 静的ファイルだけならアダプターが要らず、Worker のコードを持たずに済む
- ブランチごとの固定のプレビュー URL が PR にコメントされるので、記事も機能も同じ流れで確かめられる
- GTM は INP と LCP を悪くしやすい。必要な計測は Web Analytics の Core Web Vitals で足りる

## 影響・トレードオフ

- プレビュー URL は workers.dev 上に公開される。未公開の記事を見せたくなければ Access で守る
- 下書きは本番ビルドで除き、プレビュービルドでだけ出す（環境変数で切り替える）
