# 改善バックログ

改善候補と、まだ決まっていないことの一覧です。Issue があればリンクします。優先度の決め方は [`../improvement-loop.md`](../improvement-loop.md) を参照。
着手したら `- [x]` にし、完了したら [`log.md`](./log.md) に 1 行記録してここから消します。

## 本番の切り替え

- [ ] 本番の切り替え（下の Cloudflare の設定ができたらすぐ行う。手順は `docs/specs/microcms-migration.md` の「切り替え」。本番のドメインは `https://tkc310.com`）

## 人が Cloudflare・GitHub で行う設定

- [ ] Cloudflare で Worker（`astro-blog`）を作り、GitHub の `tkc310/astro-blog` とつなぐ（Workers Builds）。ビルドコマンドは `pnpm run build`（Workers Builds には `vp` と `make` の前提が無いので、`package.json` のスクリプトを直接呼ぶ）、デプロイは `npx wrangler deploy`、非本番ブランチのビルドを有効にする。Node.js は `.node-version`、pnpm は `packageManager` から決まる。pnpm が切り替わらずに入れられないときは、ビルド変数に `PNPM_VERSION=11.28.6` を足す
- [ ] GitHub の Settings で「Automatically delete head branches」を有効にする
- [ ] Sveltia CMS の GitHub ログインを確かめる。認証の Worker（`https://astro-blog-sveltia-cms-auth.takashisato-develop.workers.dev`）が 2026-10-20 の時点で `error code: 1042` を返していた。Worker がデプロイされているか、workers.dev の URL が有効か、`ALLOWED_DOMAINS` に `tkc310.com` とプレビューのドメインがあるか、OAuth App のコールバックが `<Worker の URL>/callback` かを見る

## Markdown の拡張（その PR で確かめる）

- [ ] Workers にデプロイしたあと、`/articles/<id>` がリダイレクトなしに 200 で返るか（ビルドが `articles/<id>.html` を出すことは `check-output` で確かめ済み）

## 仕組み

- [ ] `.astro` のフォーマットと静的検査。Oxfmt・Oxlint は `.astro` を対象にしない（Oxfmt 0.73 で確かめた）。型は `astro check` が見る。フォーマットは Prettier と `prettier-plugin-astro` を `.astro` だけに使うかを決める
- [ ] コミットメッセージを検査する仕組み（`commit-msg` フックと CI）
- [ ] ビルド出力の検査を広げる（内部リンク切れ、ページごとの JS の量）。JSON-LD・canonical・OGP の有無は SEO の PR で足した
- [ ] Issue テンプレート「改善提案」で起票されたものを、バックログに転記する流れを決める
