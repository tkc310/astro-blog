// Vite+（vp）の検査とテストの設定（ADR-0003）。
// Astro のビルドは astro.config.mjs が持ち、このファイルは読まない。
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    // scripts/screenshots は CI でだけ入れる Playwright を使うので、型の検査から外す。
    ignorePatterns: ["dist/**", ".astro/**", ".wrangler/**", "scripts/screenshots/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    // src/content/ は管理画面（Sveltia CMS）が書くファイルなので、整形の検査から外す（ADR-0023）。
    // 管理画面は保存のたびにファイル全体を自分の形（表の列をそろえない・入れ子の字下げ 4）で書き直す。
    ignorePatterns: ["dist/**", ".astro/**", ".wrangler/**", "pnpm-lock.yaml", "src/content/**"],
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
