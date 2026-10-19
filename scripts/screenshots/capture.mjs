// 手元で動かしたサイト（make preview と同じ astro preview。Workers の静的アセットと Worker を workerd で動かす）の
// 主なページのスクリーンショットを撮る。CI の Screenshots ワークフローが、プロジェクトの外に入れた Playwright で動かす。
// 使い方: node capture.mjs <サイトの URL> <出力先>
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

const [baseArg, outArg] = process.argv.slice(2);
const base = (baseArg ?? "http://localhost:4321").replace(/\/$/, "");
const OUT = outArg ?? "screenshots";

const pages = [
  { name: "top", path: "/" },
  { name: "articles", path: "/articles" },
  { name: "article", path: process.env.SCREENSHOT_ARTICLE ?? "/articles/hello-astro-blog" },
  { name: "category", path: process.env.SCREENSHOT_CATEGORY ?? "/articles/categories/frontend" },
  { name: "404", path: "/this-page-does-not-exist" },
];

const viewports = [
  { name: "pc", width: 1280, height: 800 },
  { name: "sp", width: 390, height: 844 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const failures = [];

// 白地だけなので（ADR-0016）、OS の設定は light で撮る。
for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`${viewport.name}: ${error.message}`));
  for (const target of pages) {
    await page.goto(`${base}${target.path}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: join(OUT, `${target.name}-${viewport.name}.png`),
      fullPage: true,
    });
  }
  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.error("ページで JavaScript のエラーが出ました:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`スクリーンショットを ${OUT}/ に保存しました。`);
