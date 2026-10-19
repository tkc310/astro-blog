#!/usr/bin/env bash
# CI の 1 手順を実行し、失敗したら出力の末尾を GitHub Actions の注釈（annotation）として出す。
# 注釈は API（check-runs の annotations）で読めるので、ログ本体を開けない環境のエージェントでも原因を追える。
# 使い方: scripts/ci-step.sh "<見出し>" <コマンド> [引数...]
set -uo pipefail

title="$1"
shift

output_file="$(mktemp)"
"$@" 2>&1 | tee "$output_file"
status="${PIPESTATUS[0]}"

if [ "$status" -ne 0 ]; then
  # 注釈は改行を %0A で表す。長すぎると切られるので末尾の 120 行だけ送る。
  tail -n 120 "$output_file" \
    | sed -e 's/\x1b\[[0-9;]*[A-Za-z]//g' \
    | awk 'BEGIN { ORS = "%0A" } { gsub(/%/, "%25"); gsub(/\r/, ""); print }' \
    | { read -r -d '' body; printf '::error title=%s::%s\n' "$title" "$body"; }
fi

rm -f "$output_file"
exit "$status"
