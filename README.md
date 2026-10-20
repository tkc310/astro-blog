# astro-blog

[tkc310.com](https://tkc310.com) のソースです。microCMS + Next.js で作っていたブログ（[tkc310/microCMS_blog](https://github.com/tkc310/microCMS_blog)）を、Astro の SSG と Cloudflare Workers に移しました（2026-10-20 に切り替え）。

- 記事はこのリポジトリの Markdown が正本です。管理画面（Sveltia CMS、[`/admin/`](https://tkc310.com/admin/)）からも書け、保存は Pull Request になります
- ページはビルド時に作り、Cloudflare Workers の静的アセットで配信します。私について（`/about`）だけは Worker で描き、Cloudflare にキャッシュします
- 目標は Core Web Vitals と Lighthouse の高得点、JSON-LD による SEO・AIO です

## 技術スタック

| 役割           | 使うもの                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| フレームワーク | Astro 7（`output: 'static'`）＋ `@astrojs/cloudflare`                           |
| 記事           | Markdown（`unified()`・リンクカード・Expressive Code）                          |
| 管理画面       | Sveltia CMS ＋ 認証の Worker（`sveltia-cms-auth`）                              |
| 配信           | Cloudflare Workers（静的アセット）＋ Workers Builds（PR ごとのプレビュー）      |
| 検査・テスト   | Vite+（`vp`。Oxlint・Oxfmt・Vitest）、`astro check`、Lighthouse CI              |
| ツールの版     | Node.js 24（`.node-version`）、pnpm 12（`packageManager`）、mise（`mise.toml`） |

判断の理由は [`docs/decisions/`](./docs/decisions/README.md)（ADR）にあります。

## 環境構築

必要なもの: Git、[mise](https://mise.jdx.dev/)（または asdf）、`make`

```bash
git clone https://github.com/tkc310/astro-blog.git
cd astro-blog
make setup   # mise か asdf で Node.js・pnpm を入れ、pnpm install で依存を入れる
make dev     # http://localhost:4321
```

asdf を使うときは、`~/.asdfrc` に `legacy_version_file = yes` を書いておきます（Node.js を `.node-version` から読ませるため）。`make setup` が asdf のプラグインと Node.js・pnpm を入れ、ホームに pnpm の版が無ければ `asdf set -u` で置きます。プロジェクトには `.tool-versions` を置きません（Workers Builds が読んでビルドが止まるため。ADR-0019）。pnpm は 10 以上ならどの版でも、`package.json` の `packageManager` の版に切り替わります。

`.env` は要りません。秘密情報（API キー・OAuth のシークレット・Cloudflare のトークン）はコミットしないでください。

## 開発の手順

1. `main` からブランチを切る（`feat/…`・`fix/…`・`post/…`）
2. 変更して、`make check` を通す（型検査 → 静的検査 → テスト → ビルド → ビルド結果の検査）
3. Pull Request を出す。CI（check・Lighthouse・スクリーンショット）と Workers Builds のプレビュー URL で確かめる
4. `main` にマージすると、Workers Builds が本番にデプロイする

詳しい流れ・コミットメッセージの書き方は [`CONTRIBUTING.md`](./CONTRIBUTING.md) にあります。

### よく使うコマンド

| コマンド                        | やること                                                   |
| ------------------------------- | ---------------------------------------------------------- |
| `make dev`                      | 開発サーバ（下書きも見るなら `SHOW_DRAFTS=true make dev`） |
| `make check`                    | CI と同じ検査をすべて                                      |
| `make fmt-fix`                  | フォーマットと、自動で直せる指摘を直す                     |
| `make test ARGS="src/lib"`      | テストを一部だけ回す                                       |
| `make build` → `make preview`   | 本番と同じ Workers の形で手元で確かめる                    |
| `make outdated` / `make update` | 依存パッケージの確認と、範囲の中での更新                   |
| `make help`                     | コマンドの一覧                                             |

## 記事を書く

手順と注意点は [`docs/writing-posts.md`](./docs/writing-posts.md) にあります。形式の規則は [`rules/content.md`](./rules/content.md) です。

## ディレクトリ

```
src/
  content/posts/        記事（<id>.md。URL は /articles/<id>）
  content/categories/   カテゴリ（<id>.yml）
  content/profile/      私について の自己紹介
  assets/posts/<id>/    記事の画像
  pages/ components/ layouts/ styles/ lib/
public/
  admin/                管理画面（Sveltia CMS の設定は config.yml）
  _redirects            旧 URL からの 301
scripts/                ビルド結果の検査・移行スクリプト・設定のテスト
rules/                  構成・記事・SEO の規則（エージェントも人も従う）
docs/                   指示書（specs）・ADR（decisions）・改善ログ（improvement）
```

## AI エージェントと開発する

エージェント向けの入口は [`AGENTS.md`](./AGENTS.md) です（Claude Code は `CLAUDE.md` から読みます）。直したことは [`docs/improvement/log.md`](./docs/improvement/log.md) に、残っている改善は [`docs/improvement/backlog.md`](./docs/improvement/backlog.md) にあります。
