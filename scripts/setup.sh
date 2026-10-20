#!/usr/bin/env bash
# make setup の中身。Node.js と pnpm を mise か asdf で入れ、依存パッケージを入れる（ADR-0019）。
# 版は mise.toml・.node-version・package.json の packageManager にあり、scripts/tool-versions.test.ts がそろえる。
set -euo pipefail
cd "$(dirname "$0")/.."

node_version=$(tr -d '[:space:]' < .node-version)
pnpm_version=$(sed -n 's/.*"packageManager": "pnpm@\([^"]*\)".*/\1/p' package.json)

if command -v mise > /dev/null; then
  mise install
elif command -v asdf > /dev/null; then
  # asdf は .tool-versions が無いと版を決められない。.tool-versions は Workers Builds が読んで
  # ビルドが止まるので置かない。Node.js は .node-version（legacy_version_file）から読ませる。
  if ! grep -qs '^legacy_version_file *= *yes' "${ASDF_CONFIG_FILE:-$HOME/.asdfrc}"; then
    echo "~/.asdfrc に legacy_version_file = yes を書いてください（.node-version を読ませるため）。" >&2
    exit 1
  fi
  for plugin in nodejs pnpm; do
    asdf plugin list | grep -qx "$plugin" || asdf plugin add "$plugin"
  done
  asdf install nodejs "$node_version"
  asdf install pnpm "$pnpm_version"
  # pnpm はどの版でも packageManager の版に切り替わる。ホームに版が無いときだけ置く（ほかのプロジェクトの設定は変えない）。
  if ! asdf current pnpm > /dev/null 2>&1; then
    asdf set -u pnpm "$pnpm_version"
    echo "ホームの pnpm を $pnpm_version にしました（asdf set -u）。"
  fi
else
  echo "mise か asdf を入れてください（CONTRIBUTING.md の「開発環境」）。" >&2
  exit 1
fi

pnpm install
