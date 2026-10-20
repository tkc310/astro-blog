# 改善バックログ

改善候補と、まだ決まっていないことの一覧です。Issue があればリンクします。優先度の決め方は [`../improvement-loop.md`](../improvement-loop.md) を参照。
着手したら `- [x]` にし、完了したら [`log.md`](./log.md) に 1 行記録してここから消します。

## 本番の切り替えのあと

- [ ] Cloudflare の **SSL/TLS → エッジ証明書** で「常に HTTPS を使用」をオンにする（2026-10-20 の時点で `http://tkc310.com/` が 301 にならず 200 を返していた）
- [ ] microCMS の Webhook（記事の更新で Vercel のビルドを走らせるもの）を止める（`docs/specs/microcms-migration.md` §6 の手順 5）
- [ ] 数日様子を見て問題が無ければ、Vercel のプロジェクトを消し、Cloudflare の DNS から `_vercel` の TXT を消す（手順 6。これ以降は Vercel に戻せない）
- [ ] Search Console にサイトマップ（`https://tkc310.com/sitemap-index.xml`）を出し直し、カバレッジを 2 週間ほど見る（手順 7）
- [ ] 問題が無ければ、移行スクリプト（`scripts/migrate-legacy.ts`・`make migrate`・`scripts/legacy-urls.txt` 以外の移行専用のもの）を消し、microCMS の契約を止める（手順 8）

## 仕組み

- [ ] `.astro` のフォーマットと静的検査。Oxfmt・Oxlint は `.astro` を対象にしない（Oxfmt 0.73 で確かめた）。型は `astro check` が見る。フォーマットは Prettier と `prettier-plugin-astro` を `.astro` だけに使うかを決める
- [ ] コミットメッセージを検査する仕組み（`commit-msg` フックと CI）
- [ ] ビルド出力の検査を広げる（内部リンク切れ、ページごとの JS の量）。JSON-LD・canonical・OGP の有無は SEO の PR で足した
- [ ] Issue テンプレート「改善提案」で起票されたものを、バックログに転記する流れを決める
