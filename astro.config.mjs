// @ts-check
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import { unified } from "@astrojs/markdown-remark";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkLinkCard from "remark-link-card-plus";

import { shouldShowDrafts } from "./src/lib/drafts.ts";
import { rehypeLinkCardImages } from "./src/lib/markdown/link-card-images.ts";
import { SITE_URL } from "./src/site.config.ts";

// ページはビルド時に作り、末尾スラッシュなしの URL で配信する（ADR-0001・ADR-0006）。
// 私について（/about）だけは LAPRAS の活動を載せるため、Worker で描画して Cloudflare にキャッシュする（ADR-0017）。
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
  // コードブロックは Expressive Code（ADR-0008）。白地に合わせて枠と影を消し、地は --wash に寄せる（ADR-0016）。
  integrations: [
    expressiveCode({
      themes: ["github-light"],
      useDarkModeMediaQuery: false,
      defaultProps: { wrap: false },
      styleOverrides: {
        borderRadius: "4px",
        borderWidth: "0",
        codeBackground: "#f6f6f6",
        codeFontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.8",
        codePaddingBlock: "1.25rem",
        codePaddingInline: "1.5rem",
        uiFontFamily: "inherit",
        uiFontSize: "0.75rem",
        uiPaddingBlock: "0.5rem",
        uiPaddingInline: "1.5rem",
        frames: {
          shadowColor: "transparent",
          editorTabBarBackground: "#f6f6f6",
          editorActiveTabBackground: "#f6f6f6",
          editorActiveTabIndicatorTopColor: "transparent",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorActiveTabForeground: "#6f6f6f",
          editorTabBarBorderBottomColor: "#ececec",
          editorTabBorderRadius: "0",
          terminalTitlebarBackground: "#f6f6f6",
          terminalBackground: "#f6f6f6",
          terminalTitlebarBorderBottomColor: "#ececec",
          inlineButtonBorder: "#c2c2c2",
          inlineButtonForeground: "#6f6f6f",
          tooltipSuccessBackground: "#000000",
        },
      },
    }),
  ],
  markdown: {
    // remark/rehype のプラグインを使うため unified() にする（ADR-0008）。
    processor: unified({
      remarkPlugins: [
        // URL だけの段落を、ビルド時に OGP を取ってリンクカードにする。取れなければ普通のリンクのまま。
        // 画像とファビコンは public/remark-link-card-plus/ に保存して、自分のサイトから出す。
        [remarkLinkCard, { cache: true, shortenUrl: true, thumbnailPosition: "right" }],
      ],
      rehypePlugins: [
        rehypeLinkCardImages,
        [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
      ],
    }),
  },
});
