// ビルド結果（dist/）を検査する。CI で `vp run check-output` として回す（docs/improvement-loop.md）。
// 規則を足したら、ここにも検査を足す。
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
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
  console.error(`${DIST}/ がありません。先に vp run build を実行してください。`);
  process.exit(1);
}

// 末尾スラッシュなしの URL を返すため、ページは <path>.html で出す（ADR-0006）。
for (const file of ["index.html", "404.html"]) {
  if (!existsSync(join(DIST, file))) fail(`${file} がありません`);
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
