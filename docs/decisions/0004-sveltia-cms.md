# 0004 管理画面は Git-based の Sveltia CMS にする

- 日付: 2026-10-19
- 状態: 採用（置き方と本体の配り方は ADR-0022 で変えた）

## 背景

記事は Markdown をリポジトリに置く（ADR-0002）。エディタでも書けるが、ブラウザやスマホから書ける管理画面とプレビューがほしい。

## 決定

- 管理画面は Sveltia CMS（Decap CMS の後継として作り直された Git-based CMS）にする
- `/admin/` に静的ページとして置き、設定は `public/admin/config.yml` に書く（→ ADR-0022: `/admin` に置き、本体は npm のパッケージから自分で配る）
- GitHub の認証は `sveltia-cms-auth` を別の Cloudflare Worker として動かし、GitHub OAuth App とつなぐ
- CMS からの保存は下書きブランチに行い、プレビュー URL で確かめてから `main` にマージする
- `/admin/` は `noindex` にし、`robots.txt` でも除外する

## 理由

- バックエンドの要らない PWA なので、SSG の静的配信に収まる
- 記事は Markdown のまま読み書きされ、Git の履歴に残る
- Keystatic は管理画面に Node のサーバが要り、TinaCMS・Pages CMS は外部サービスへの依存が増える

## 影響・トレードオフ

- Astro の Zod スキーマと Sveltia の `config.yml` の 2 か所にスキーマを書く。frontmatter を変えたら両方を直す（`rules/content.md`）
- 動的に動くものは認証の Worker だけになる
