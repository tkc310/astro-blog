# 改善バックログ

改善候補と、まだ決まっていないことの一覧です。Issue があればリンクします。優先度の決め方は [`../improvement-loop.md`](../improvement-loop.md) を参照。
着手したら `- [x]` にし、完了したら [`log.md`](./log.md) に 1 行記録してここから消します。

## 決めること

- [ ] 本番のドメインと、DNS を切り替える日。旧サイト（Next.js）の止め方
- [ ] microCMS の下書き記事（未公開）を `draft: true` で移すか、移さないか
- [ ] About ページに載せる内容（旧ブログの自己 PR と LAPRAS の活動一覧をどこまで残すか）。JSON-LD の `Person` に入れる `jobTitle`・`knowsAbout` も、ここに表示する文言から決める
- [ ] 記事に読了時間とライセンス（例: CC BY 4.0）を表示するか。表示すれば JSON-LD の `timeRequired`・`license` も出せる

## 雛形（実装の最初の PR で確かめる）

- [ ] Astro 7 と Vite+ の組み合わせで `vp run dev`・`vp run build` が通るか（Vite+ は `vite` を `@voidzero-dev/vite-plus-core` に置き換える）
- [ ] `markdown.processor: unified()` で、remark-link-card-plus と Expressive Code が一緒に動くか
- [ ] Astro 7 の `render()` が見出しの一覧（`headings`）を返すか。返さなければ目次の作り方を指示書で決め直す
- [ ] Oxlint・Oxfmt が `.astro` をどこまで扱えるか。足りなければ `.astro` だけ別の道具に分ける
- [ ] `build.format: 'file'` と Workers の `html_handling`（既定の `auto-trailing-slash`）で、`/articles/<id>` がリダイレクトなしに 200 で返るか

## 仕組み

- [ ] コミットメッセージを検査する仕組み（`commit-msg` フックと CI）を雛形と一緒に入れる
- [ ] CI（GitHub Actions、`voidzero-dev/setup-vp`）で `vp check`・`vp test`・`vp run typecheck`・ビルドを回す
- [ ] ビルド出力の検査スクリプト（JSON-LD・canonical・OGP の有無、内部リンク切れ、ページごとの JS の量）
- [ ] 旧 URL の一覧を作り、移行後に 200 か 301 で返るかを CI で確かめる
- [ ] Lighthouse CI の閾値を決める
- [ ] Issue テンプレート「改善提案」で起票されたものを、バックログに転記する流れを決める
