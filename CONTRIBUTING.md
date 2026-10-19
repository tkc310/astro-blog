# コントリビュートガイド

開発の流れ、コミットメッセージ、記事の書き方をまとめます。AI エージェント向けの入口は [`AGENTS.md`](./AGENTS.md) です。

- [いまの段階](#いまの段階)
- [開発環境](#開発環境)
- [開発の流れ](#開発の流れ)
- [コミットメッセージ](#コミットメッセージ)
- [記事を書く](#記事を書く)
- [守ってほしいこと](#守ってほしいこと)

## いまの段階

実装中です。指示書（[`docs/specs/`](./docs/specs/)）の「進め方」の順に、1 PR ずつ作っています。指示書に無い機能は、先に指示書と ADR（[`docs/decisions/`](./docs/decisions/README.md)）を Pull Request でレビューして合意します。

## 開発環境

ツールの版は [`.tool-versions`](./.tool-versions) にまとめてあり、[mise](https://mise.jdx.dev/) で入れます。CI も同じファイルを読みます。

| ツール  | `.tool-versions` の名前 | 用途                                                 |
| ------- | ----------------------- | ---------------------------------------------------- |
| Node.js | `node`                  | 実行環境                                             |
| pnpm    | `pnpm`                  | パッケージ管理（`package.json` の `packageManager`） |
| Vite+   | `viteplus`              | `vp` コマンド（検査・テスト・タスク実行）            |

```bash
git clone https://github.com/tkc310/astro-blog.git
cd astro-blog
mise install   # .tool-versions の node・pnpm・vp を入れる
vp install     # 依存パッケージを入れる
vp run dev     # http://localhost:4321
```

`viteplus` は mise のレジストリの名前で、asdf にはプラグインがありません。asdf を使う場合は node と pnpm だけを入れ、`vp` は Vite+ の公式のインストーラー（`curl -fsSL https://vite.plus | bash`）で入れてください。

版を上げるときは、`.tool-versions` と一緒に次も同じ版にします。ずれていると `vp test`（`scripts/tool-versions.test.ts`）が失敗します。

- pnpm: `package.json` の `packageManager`
- Vite+: `package.json` の `vite-plus` と、`pnpm-workspace.yaml` の `vite` の置き換え先

コマンドの一覧は [`AGENTS.md`](./AGENTS.md) の「開発者用のコマンド」にあります。`package.json` のスクリプトは `vp run <名前>` で、検査とテストは `vp check`・`vp test` で実行します。

## 開発の流れ

1. `main` から作業ブランチを切る（例: `feat/toc`、`fix/jsonld-date`、`post/astro-6-migration`）
2. 変更する。機能を足す・大きく変えるときは、先に `docs/specs/` に指示書を書く
3. 検査を通す: `vp run typecheck`・`vp check`・`vp test`・`vp run build`・`vp run check-output`（CI も同じ順で回す）
4. Pull Request を作り、テンプレートのチェックリストを埋める
5. Cloudflare Workers Builds がブランチのプレビュー URL を PR にコメントする（Cloudflare 側の設定が済んでから。[バックログ](./docs/improvement/backlog.md)）。見た目と構造化データをそこで確かめる
6. `main` にマージすると本番に反映される

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/) で書きます。1 コミットには 1 つの関心事だけを入れます。

```
feat(post): 記事詳細に目次を付ける
fix(seo): BlogPosting の dateModified を updatedDate から出す
docs: ADR-0006 を足す
post: Astro 7 への移行メモを公開する
```

| type       | 使いどころ                     |
| ---------- | ------------------------------ |
| `feat`     | 機能の追加・変更               |
| `fix`      | 不具合の修正                   |
| `perf`     | 性能の改善                     |
| `refactor` | 振る舞いを変えない整理         |
| `test`     | テストだけの変更               |
| `docs`     | 開発用ドキュメントだけの変更   |
| `post`     | 記事の追加・更新               |
| `build`    | ビルドや依存、検査ツールの変更 |
| `ci`       | GitHub Actions の変更          |
| `chore`    | 上のどれにも当たらない雑務     |

- 1 行目は `type(scope): 説明`。scope は省略でき、英小文字・数字・`-` で書きます（例: `post`・`seo`・`cms`・`layout`・`deploy`）。互換を壊す変更は `feat!:` のように `!` を付けます
- 説明は「〜する」の形で、終わりに句点を付けません（日本語でも英語でもかまいません）
- 本文が要るときは 1 行あけて書きます

## 記事を書く

記事は `src/content/posts/` の Markdown が正本です（ADR-0002）。形式は [`rules/content.md`](./rules/content.md) に従います。

- エディタで書くか、`/admin/` の Sveltia CMS で書きます（ADR-0004）
- 公開前の記事は frontmatter に `draft: true` を付けます。プレビュー URL でだけ表示されます
- 記事だけの変更は `post` の type でコミットします

## 守ってほしいこと

- [`rules/`](./rules/) の規則に従う
- 秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）をコミットしない
- 直したことは [`docs/improvement/log.md`](./docs/improvement/log.md) に 1 行記録し、再発防止を足す。手順は [改善ループ](./docs/improvement-loop.md)、判断の記録は [`docs/decisions/`](./docs/decisions/README.md)
