# 0020 依存パッケージの版の上げ方（pnpm 12 に上げ、TypeScript は 6 系、@types/node は Node.js の版に合わせる）

- 日付: 2026-10-20
- 状態: 採用

## 背景

依存パッケージを見直した。`make outdated` で、範囲の外に新しい版があったのは pnpm（11 → 12）、TypeScript（6 → 7）、`@types/node`（24 → 26）、`yaml`（2.8 → 2.9）だった。

## 決定

- pnpm は 12.14.0 に上げる。12 は Rust で書き直した版だが、コマンド・設定・ロックファイルの形は 11 と同じで、ロックファイルは書き換わらなかった
- TypeScript は 6 系（6.0.3）に据え置く。TypeScript 7 は Go で書き直した版で、従来のコンパイラの API を持たない。`astro check`（`@astrojs/check`）の対応範囲は `^5.0.0 || ^6.0.0` で、Astro の型検査が動かない
- `@types/node` は、動かす Node.js の版（`.node-version` の 24 系）と同じメジャーに合わせる。26 の型を入れると、24 に無い API を使っても型検査を通ってしまう
- Node.js は 24 系（LTS）の最新のままにする。26 はまだ LTS になっていない
- 範囲の中の更新（Astro・wrangler など）は `make update` で行う

## 理由

- 型検査と実行環境の版がずれると、検査が通るのに本番で壊れる変更を見逃す
- メジャーを上げるのは、上げた先で `make check` と本番のビルドが通ると分かるときだけにする

## 影響・トレードオフ

- `@astrojs/check` が TypeScript 7 に対応したら、この ADR を見直す
- Node.js 26 が LTS になったら、`.node-version`・`mise.toml`・`@types/node` を一緒に上げる
