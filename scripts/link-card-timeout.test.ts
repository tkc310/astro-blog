// リンクカードの OGP の取得に打ち切りの時間があるかを確かめる（pnpm-workspace.yaml の patchedDependencies）。
// open-graph-scraper の timeout は秒で、remark-link-card-plus 0.8.1 は 10000 を渡していた。
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { expect, test } from "vite-plus/test";

const require = createRequire(import.meta.url);

test("remark-link-card-plus は OGP の取得を 30 秒以内で打ち切る", () => {
  const source = readFileSync(require.resolve("remark-link-card-plus"), "utf8");
  const timeouts = [...source.matchAll(/client\(\{[^}]*?timeout:\s*(\d+)/g)].map(([, s]) =>
    Number(s),
  );
  expect(timeouts.length).toBeGreaterThan(0);
  for (const seconds of timeouts) expect(seconds).toBeLessThanOrEqual(30);
});
