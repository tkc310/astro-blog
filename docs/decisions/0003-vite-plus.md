# 0003 コマンドとツールチェーンの入口を Vite+（`vp`）にまとめる

- 日付: 2026-10-19
- 状態: 採用

## 背景

フォーマット・静的検査・型検査・テスト・タスク実行を、それぞれ別の道具（Prettier・ESLint・tsc・Vitest・npm scripts）で組むと、設定とコマンドが散らばる。Vite+ は v0.2.2 でベータになり、MIT ライセンスで公開されている。

## 決定

- コマンドの入口を `vp` にする。文書・Git フック・CI は `vp` の形で書く
- `vp check`（Oxfmt・Oxlint・型検査）、`vp test`（Vitest）、`vp run <script>`（`package.json` のスクリプト）を使う
- `astro dev`・`astro build`・`astro check` は `package.json` のスクリプトに書き、`vp run` から呼ぶ
- CI は `voidzero-dev/setup-vp` で `vp` を入れる

## 理由

- 1 つの依存と 1 つの設定（`vite.config.ts`）で検査がそろい、人もエージェントも覚えるコマンドが少ない
- Astro 7 は Vite 8 を使うので、Vite+ の Vite とも版がそろう

## 影響・トレードオフ

- Vite+ は `vite` を `@voidzero-dev/vite-plus-core` に置き換える。Astro が内部で使う Vite と競合しないかを、雛形の最初の PR で確かめる。競合したら、ビルドは素の `astro build` を `vp run` 経由で呼ぶ形に戻す
- Oxlint・Oxfmt が `.astro` をどこまで扱えるかは未確認。足りなければ `.astro` だけ別の道具に分ける（バックログ）
