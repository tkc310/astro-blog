# 0019 ツールの版は `mise.toml` と `.node-version` に書き、`.tool-versions` は置かない

- 日付: 2026-10-20
- 状態: 採用

## 背景

ツールの版を `.tool-versions`（`node`・`pnpm`）にまとめ、mise と GitHub Actions が読んでいた。Cloudflare の Workers Builds で初めてビルドしたところ、`Found a .tool-versions file in repository root. Installing dependencies.` の直後に `Failed: error occurred while installing tools or dependencies` で止まった。

Workers Builds のビルドイメージは、`.tool-versions` を見つけると asdf で入れようとする。asdf では Node.js のプラグインの名前が `nodejs` で、`node` と `pnpm` の行は入れられない。Workers Builds が版のファイルとして公式に読むのは `.nvmrc` と `.node-version` で、pnpm は `PNPM_VERSION` の環境変数だけだ。

## 決定

- `.tool-versions` を消し、mise には `mise.toml` の `[tools]` で `node` と `pnpm` を渡す
- Node.js の版は `.node-version` にも書き、GitHub Actions（`setup-node` の `node-version-file`）と Workers Builds はこれを読む
- pnpm の版は `package.json` の `packageManager` が正本で、Workers Builds（既定は pnpm 10.11.1）や手元の別の版の pnpm も、これに合わせて切り替わる（pnpm の `manage-package-manager-versions`）
- `scripts/tool-versions.test.ts` が、`.tool-versions` が無いこと、`mise.toml` と `.node-version`・`packageManager` の版が同じことを確かめる

## 理由

- `.tool-versions` を asdf 向けに `nodejs` と書き直しても、Workers Builds の asdf に pnpm のプラグインがあるかは分からず、入る Node.js の版も限られる（Cloudflare Pages では、入れられる版の一覧から外れるとビルドが止まった例がある）
- `mise.toml` は mise 専用のファイルで、Workers Builds は読まない。`.node-version` は Workers Builds・`setup-node`・mise のどれもが公式に扱う

## 影響・トレードオフ

- Node.js の版を 2 か所（`mise.toml`・`.node-version`）に書く。ずれはテストが止める
- asdf を使う人は、Node.js を `.node-version` から読む（`~/.asdfrc` に `legacy_version_file = yes`）。pnpm はプロジェクトで版を決めないので、`asdf set -u pnpm <版>` でホームに 10 以上の版を置く。どの版でも `packageManager` の版に切り替わる（pnpm 10.33.4 で確かめた）
- Workers Builds で pnpm が `packageManager` の版に切り替わらなければ、ビルド変数に `PNPM_VERSION` を足す
