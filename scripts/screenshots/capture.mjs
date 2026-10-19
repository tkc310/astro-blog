// ビルド結果（dist/）を手元のサーバで配り、主なページのスクリーンショットを撮る。
// CI の Screenshots ワークフローが、プロジェクトの外に入れた Playwright で動かす。
// 使い方: node capture.mjs <dist のパス> <出力先>
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

import { chromium } from "playwright";

const [distArg, outArg] = process.argv.slice(2);
const DIST = distArg ?? "dist";
const OUT = outArg ?? "screenshots";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

// Workers の静的アセットと同じく、/foo を foo.html で返す（ADR-0006）。
function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [clean, `${clean}.html`, join(clean, "index.html")];
  for (const candidate of candidates) {
    const file = join(DIST, candidate);
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return undefined;
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const file = resolve(url.pathname === "/" ? "/index.html" : url.pathname);
  if (!file) {
    response.writeHead(404, { "content-type": TYPES[".html"] });
    createReadStream(join(DIST, "404.html")).pipe(response);
    return;
  }
  response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});

await new Promise((done) => server.listen(4321, done));
const base = "http://localhost:4321";

const pages = [
  { name: "top", path: "/" },
  { name: "article", path: process.env.SCREENSHOT_ARTICLE ?? "/articles/hello-astro-blog" },
  { name: "category", path: process.env.SCREENSHOT_CATEGORY ?? "/articles/categories/frontend" },
  { name: "about", path: "/about" },
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
  // LAPRAS の API は外へ出ないよう止める（撮影の結果を毎回同じにするため）。
  await context.route("https://lapras.com/**", (route) => route.abort());
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
server.close();

if (failures.length > 0) {
  console.error("ページで JavaScript のエラーが出ました:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`スクリーンショットを ${OUT}/ に保存しました。`);
