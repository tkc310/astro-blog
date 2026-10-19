# 改善バックログ

改善候補と、まだ決まっていないことの一覧です。Issue があればリンクします。優先度の決め方は [`../improvement-loop.md`](../improvement-loop.md) を参照。
着手したら `- [x]` にし、完了したら [`log.md`](./log.md) に 1 行記録してここから消します。

## 決めること

- [ ] 本番を切り替える日（移行の PR をマージしてから決める。手順は `docs/specs/microcms-migration.md` の「切り替え」）
- [ ] 本番のドメインが `https://tkc310.com` で合っているか（`src/site.config.ts` の `SITE_URL` に仮で入れた。旧ブログはドメインを環境変数に持っていた）

## 人が Cloudflare・GitHub で行う設定

- [ ] Cloudflare で Worker（`astro-blog`）を作り、GitHub の `tkc310/astro-blog` とつなぐ（Workers Builds）。ビルドコマンドは `vp run build`、デプロイは `npx wrangler deploy`、非本番ブランチのビルドを有効にする
- [ ] GitHub の Settings で「Automatically delete head branches」を有効にする

## Markdown の拡張（その PR で確かめる）

- [ ] `markdown.processor: unified()` で、remark-link-card-plus と Expressive Code が一緒に動くか
- [ ] Workers にデプロイしたあと、`/articles/<id>` がリダイレクトなしに 200 で返るか（ビルドが `articles/<id>.html` を出すことは `check-output` で確かめ済み）

## 仕組み

- [ ] `.astro` のフォーマットと静的検査。Oxfmt・Oxlint は `.astro` を対象にしない（Oxfmt 0.73 で確かめた）。型は `astro check` が見る。フォーマットは Prettier と `prettier-plugin-astro` を `.astro` だけに使うかを決める
- [ ] コミットメッセージを検査する仕組み（`commit-msg` フックと CI）
- [ ] ビルド出力の検査を広げる（JSON-LD・canonical・OGP の有無、内部リンク切れ、ページごとの JS の量）
- [ ] 旧 URL の一覧を作り、移行後に 200 か 301 で返るかを CI で確かめる
- [ ] Lighthouse CI の閾値を決める
- [ ] Issue テンプレート「改善提案」で起票されたものを、バックログに転記する流れを決める
