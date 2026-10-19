# 0014 コマンドの入口を Makefile にまとめる

- 日付: 2026-10-19
- 状態: 採用

## 背景

ADR-0003 でコマンドの入口を `vp` にした。ところが `vp` には、組み込みのコマンド（`vp check`・`vp test`）と、`package.json` のスクリプトを呼ぶ `vp run <名前>` の 2 種類がある。どちらで呼ぶかを覚える必要があり、ツールを入れる `mise install` は `vp` の外にある。[tkc310/yorozuya](https://github.com/tkc310/yorozuya) は `make` に統一している（同リポジトリの ADR-0007）。

## 決定

- コマンドの入口を `Makefile` にする。人も、エージェントも、CI も `make <名前>` で呼ぶ
- 中身は `vp`・`mise` を呼ぶだけにする。検査やビルドの道具は ADR-0003 のまま（Vite+）
- 追加の引数は `ARGS` で渡す（例: `make test ARGS="src/lib"`）
- `make` だけで一覧が出る（`make help`）。各ターゲットに `## 説明` を書く
- コマンドを足すときは、`Makefile` に足し、`AGENTS.md` と `CONTRIBUTING.md` に `make` の形で書く。`package.json` のスクリプトが要るときはそれも足し、`Makefile` から `vp run` で呼ぶ
- 入れ子の `make` には `ARGS=` を付けて呼ぶ（`make` のコマンド行の変数は `MAKEFLAGS` で引き継がれるため）

## 理由

- 覚えるのは `make` だけになり、`make` で一覧が出る
- CI も `make` で回すので、`Makefile` が壊れれば CI で気づける
- `make check` 1 つで、CI と同じ順の検査を手元で回せる

## 影響・トレードオフ

- `Makefile` と `package.json` のスクリプトの 2 か所を保守する。`scripts/makefile.test.ts` が、文書との対応と CI の呼び方を検査する
- Windows では `make` が別途要る（WSL か、Git for Windows などに入っているもの）
- ADR-0003 の「コマンドの入口を `vp` にする」はこの ADR に置き換える。ツールチェーンを Vite+ にする判断はそのまま
