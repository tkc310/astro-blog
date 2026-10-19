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
    ignorePatterns: ["dist/**", ".astro/**", ".wrangler/**", "pnpm-lock.yaml"],
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
