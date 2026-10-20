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
  { name: "about", path: "/about" },
  { name: "article", path: process.env.SCREENSHOT_ARTICLE ?? "/articles/w2oz-j1lm" },
  { name: "category", path: process.env.SCREENSHOT_CATEGORY ?? "/articles/categories/tech" },
  { name: "404", path: "/this-page-does-not-exist" },
  // 管理画面（ADR-0022）。ログイン前の画面まで動くこと、CSP に止められる読み込みが無いことを確かめる。
  { name: "admin", path: "/admin", admin: true },
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
  // CSP の違反は pageerror にならず、コンソールのエラーにだけ出る。
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text()))
      failures.push(`${viewport.name} ${page.url()}: ${message.text()}`);
  });
  for (const target of pages) {
    const response = await page.goto(`${base}${target.path}`, { waitUntil: "networkidle" });
    if (target.admin) {
      if (!response?.headers()["content-security-policy"])
        failures.push(
          `${viewport.name}: ${target.path} に Content-Security-Policy のヘッダーがありません`,
        );
      // Sveltia CMS がログインの画面を描くまで待つ（本体・翻訳・フォントを読み終えたしるし）。
      await page
        .getByRole("button", { name: /GitHub/ })
        .first()
        .waitFor({ timeout: 30_000 })
        .catch(() => failures.push(`${viewport.name}: 管理画面のログインのボタンが出ませんでした`));
    }
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
