// Vite+（vp）の検査とテストの設定（ADR-0003）。
// Astro のビルドは astro.config.mjs が持ち、このファイルは読まない。
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["dist/**", ".astro/**", ".wrangler/**"],
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
