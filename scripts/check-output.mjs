// ビルド結果（dist/）を検査する。CI で `make check-output` として回す（docs/improvement-loop.md）。
// 規則を足したら、ここにも検査を足す。
// Cloudflare アダプターを使うので、静的アセットは dist/client、Worker は dist/server に出る（ADR-0017）。
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist/client";
const SERVER = "dist/server";
const errors = [];

function fail(message) {
  errors.push(message);
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith(".html") ? [path] : [];
  });
}

if (!existsSync(DIST)) {
  console.error(`${DIST}/ がありません。先に make build を実行してください。`);
  process.exit(1);
}

// 末尾スラッシュなしの URL を返すため、ページは <path>.html で出す（ADR-0006）。
for (const file of ["404.html", "articles.html", "_redirects"]) {
  if (!existsSync(join(DIST, file))) fail(`${file} がありません`);
}

// トップ（/）は Worker で描く（ADR-0017）。静的な index.html があると、アセットが先に返して Worker に届かない。
if (existsSync(join(DIST, "index.html"))) {
  fail("index.html があります。トップは prerender = false にして Worker で描いてください");
}

// Worker の設定: Workers Cache が有効で、セッションの KV と Images のバインディングを作らない。
const wranglerConfig = join(SERVER, "wrangler.json");
if (!existsSync(wranglerConfig)) {
  fail(`${wranglerConfig} がありません（Cloudflare アダプターが Worker を出していません）`);
} else {
  const config = JSON.parse(readFileSync(wranglerConfig, "utf8"));
  if (config.cache?.enabled !== true)
    fail(`${wranglerConfig}: cache.enabled が true ではありません`);
  if ((config.kv_namespaces ?? []).length > 0)
    fail(`${wranglerConfig}: KV のバインディングがあります`);
  if (config.images) fail(`${wranglerConfig}: Images のバインディングがあります`);
}

const articles = join(DIST, "articles");
if (!existsSync(articles)) {
  fail("articles/ がありません");
} else {
  for (const name of readdirSync(articles)) {
    const path = join(articles, name);
    if (statSync(path).isDirectory() && existsSync(join(path, "index.html"))) {
      fail(
        `articles/${name}/index.html があります。build.format: 'file' で articles/${name}.html にしてください`,
      );
    }
  }
}

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  const name = relative(DIST, file);
  if (!/<html[^>]*\blang="ja"/.test(html)) fail(`${name}: <html lang="ja"> がありません`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${name}: <title> がありません`);
  if (!/<meta name="description" content="[^"]+"/.test(html))
    fail(`${name}: meta description がありません`);
}

if (errors.length > 0) {
  console.error(`ビルド結果の検査で ${errors.length} 件の問題が見つかりました。`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`ビルド結果の検査に通りました（HTML ${htmlFiles(DIST).length} 件）。`);
