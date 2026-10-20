# 改善バックログ

改善候補と、まだ決まっていないことの一覧です。Issue があればリンクします。優先度の決め方は [`../improvement-loop.md`](../improvement-loop.md) を参照。
着手したら `- [x]` にし、完了したら [`log.md`](./log.md) に 1 行記録してここから消します。

## 本番の切り替え

- [ ] 本番の切り替え（Cloudflare の Worker と Workers Builds は用意できた。手順は `docs/specs/microcms-migration.md` の「切り替え」。本番のドメインは `https://tkc310.com`）

## 仕組み

- [ ] `.astro` のフォーマットと静的検査。Oxfmt・Oxlint は `.astro` を対象にしない（Oxfmt 0.73 で確かめた）。型は `astro check` が見る。フォーマットは Prettier と `prettier-plugin-astro` を `.astro` だけに使うかを決める
- [ ] コミットメッセージを検査する仕組み（`commit-msg` フックと CI）
- [ ] ビルド出力の検査を広げる（内部リンク切れ、ページごとの JS の量）。JSON-LD・canonical・OGP の有無は SEO の PR で足した
- [ ] Issue テンプレート「改善提案」で起票されたものを、バックログに転記する流れを決める
