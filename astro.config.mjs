// @ts-check
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import { defineConfig } from "astro/config";

import { shouldShowDrafts } from "./src/lib/drafts.ts";
import { SITE_URL } from "./src/site.config.ts";

// ページはビルド時に作り、末尾スラッシュなしの URL で配信する（ADR-0001・ADR-0006）。
// トップ（/）だけは LAPRAS の活動を載せるため、Worker で描画して Cloudflare にキャッシュする（ADR-0017）。
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "never",
  build: {
    // /articles/<id>.html を出し、Workers の静的アセットが /articles/<id> を 200 で返す。
    format: "file",
  },
  adapter: cloudflare({
    // ビルド時のページは Node.js で作る（Workers の外のファイルや環境変数を読むため）。
    prerenderEnvironment: "node",
    // 画像はビルド時に変換する。Images のバインディングは使わない。
    imageService: "compile",
  }),
  // セッションは使わない（KV を作らない）。
  session: false,
  // Astro.cache の中身を Cloudflare の Workers Cache に置く。開発中は効かない。
  cache: { provider: cacheCloudflare() },
  vite: {
    // 下書きを出すかはビルドの時点で決め、ビルド時のページにも Worker で描くページにも同じ値を入れる（ADR-0005）。
    define: { __SHOW_DRAFTS__: JSON.stringify(shouldShowDrafts(process.env)) },
  },
  markdown: {
    // 白地に合わせた明るい配色（ADR-0016）。コードブロックの装飾は Expressive Code の PR で見直す（ADR-0008）。
    shikiConfig: { theme: "github-light" },
  },
});
