// @ts-check
import { defineConfig } from "astro/config";

import { SITE_URL } from "./src/site.config.ts";

// すべてのページをビルド時に作り、末尾スラッシュなしの URL で配信する（ADR-0001・ADR-0006）。
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "never",
  build: {
    // /articles/<id>.html を出し、Workers の静的アセットが /articles/<id> を 200 で返す。
    format: "file",
  },
  markdown: {
    // 白地に合わせた明るい配色（ADR-0016）。コードブロックの装飾は Expressive Code の PR で見直す（ADR-0008）。
    shikiConfig: { theme: "github-light" },
  },
});
