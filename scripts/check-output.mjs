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
for (const file of [
  "404.html",
  "index.html",
  "_redirects",
  // アイコン（Base.astro の <link rel="icon">・私について）
  "favicon.ico",
  "icon-192.png",
  "apple-touch-icon.png",
  "profile.webp",
  "profile.png",
  // SEO（rules/seo.md・docs/specs/blog-replace.md §4）
  "og.png",
  "robots.txt",
  "rss/feed.xml",
  "sitemap-index.xml",
  "llms.txt",
]) {
  if (!existsSync(join(DIST, file))) fail(`${file} がありません`);
}

// 公開済みの URL を 301 で生かす（ADR-0006）。記事一覧の 1 ページ目は /。
if (existsSync(join(DIST, "_redirects"))) {
  const rules = readFileSync(join(DIST, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.replace(/#.*/, "").trim().split(/\s+/))
    .filter((parts) => parts.length === 3);
  for (const [from, to] of [
    ["/articles", "/"],
    ["/articles/page/1", "/"],
    ["/rss/atom.xml", "/rss/feed.xml"],
    ["/rss/feed.json", "/rss/feed.xml"],
    ["/sitemap.xml", "/sitemap-index.xml"],
  ]) {
    if (!rules.some((rule) => rule[0] === from && rule[1] === to && rule[2] === "301"))
      fail(`_redirects に ${from} → ${to} の 301 がありません`);
  }
}

// 旧ブログの URL は、新しいサイトでも 200（ページがある）か 301（_redirects）で返す（ADR-0006）。
// Worker で描くページ（/about、ADR-0017）は静的なファイルを持たないので、ここで並べる。
const ON_DEMAND = new Set(["/about"]);
if (existsSync(join(DIST, "_redirects"))) {
  const redirects = readFileSync(join(DIST, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.replace(/#.*/, "").trim().split(/\s+/))
    .filter((parts) => parts.length === 3 && parts[2] === "301")
    .map(([from]) => from);
  const redirected = (path) =>
    redirects.some((from) =>
      from.endsWith("/*") ? path.startsWith(from.slice(0, -1)) : from === path,
    );
  const isFile = (path) => existsSync(path) && statSync(path).isFile();
  const served = (path) =>
    ON_DEMAND.has(path) ||
    isFile(join(DIST, path === "/" ? "index.html" : `${path}.html`)) ||
    isFile(join(DIST, path));
  const legacy = readFileSync("scripts/legacy-urls.txt", "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  for (const path of legacy) {
    if (!served(path) && !redirected(path)) fail(`旧 URL ${path} が 200 にも 301 にもなりません`);
  }

  // 301 はアセットより先に効くので、ページがある URL に 301 を残すと、そのページが見えなくなる。
  for (const from of redirects) {
    if (
      !from.includes("*") &&
      from !== "/" &&
      served(from.replace(/\/$/, "")) &&
      !ON_DEMAND.has(from)
    )
      fail(`_redirects の ${from} は、ビルドしたページを隠しています。301 の行を消してください`);
  }
}

// 私について（/about）は Worker で描く（ADR-0017）。静的な about.html があると、アセットが先に返して Worker に届かない。
if (existsSync(join(DIST, "about.html"))) {
  fail("about.html があります。私については prerender = false にして Worker で描いてください");
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

// 管理画面（Sveltia CMS、ADR-0004）は検索に出さず、ページの検査から外す。
const ADMIN = join(DIST, "admin", "index.html");
if (!existsSync(ADMIN)) fail("admin/index.html がありません");
else if (!readFileSync(ADMIN, "utf8").includes('<meta name="robots" content="noindex"'))
  fail("admin/index.html: noindex がありません");
if (!existsSync(join(DIST, "admin", "config.yml"))) fail("admin/config.yml がありません");

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  const name = relative(DIST, file);
  if (name.startsWith("admin/")) continue;
  if (!/<html[^>]*\blang="ja"/.test(html)) fail(`${name}: <html lang="ja"> がありません`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${name}: <title> がありません`);
  if (!/<meta name="description" content="[^"]+"/.test(html))
    fail(`${name}: meta description がありません`);

  // どのページも canonical・OGP・Twitter Card を出す。JSON-LD は 1 つの @graph で、404 だけ出さず noindex（rules/seo.md）。
  const canonical = /<link rel="canonical" href="(https:\/\/[^"]+)"/.exec(html)?.[1];
  if (!canonical) fail(`${name}: canonical がありません`);
  else if (canonical !== new URL(canonical).origin + "/" && canonical.endsWith("/"))
    fail(`${name}: canonical の末尾にスラッシュがあります: ${canonical}`);
  for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!html.includes(`<meta property="${property}" content="`))
      fail(`${name}: ${property} がありません`);
  }
  if (!html.includes('<meta name="twitter:card" content="summary_large_image"'))
    fail(`${name}: twitter:card がありません`);
  const graphs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (name === "404.html") {
    if (graphs.length > 0) fail(`${name}: JSON-LD を出しています`);
    if (!html.includes('<meta name="robots" content="noindex"'))
      fail(`${name}: noindex がありません`);
  } else if (graphs.length !== 1) {
    fail(`${name}: JSON-LD が ${graphs.length} 個あります（1 つの @graph にまとめる）`);
  } else {
    const graph = JSON.parse(graphs[0][1]);
    if (!Array.isArray(graph["@graph"])) fail(`${name}: JSON-LD が @graph になっていません`);
  }

  // 外部へのリンクは別タブで開き、opener と参照元を渡さない（docs/specs/blog-replace.md §5）。
  for (const [tag] of html.matchAll(/<a\b[^>]*\bhref="https?:\/\/[^"]*"[^>]*>/g)) {
    if (!/\btarget="_blank"/.test(tag) || !/\brel="[^"]*\bnoopener\b[^"]*"/.test(tag))
      fail(`${name}: 外部リンクに target="_blank" と rel="noopener" がありません: ${tag}`);
  }

  // 移行した記事が microCMS の画像を読み続けないようにする（ADR-0010。契約を止めると消える）。
  if (html.includes("images.microcms-assets.io")) fail(`${name}: microCMS の画像を読んでいます`);

  // 画像は大きさを持ち、読み込みの前後でレイアウトがずれないようにする（rules/seo.md の性能）。
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag))
      fail(`${name}: 画像に width と height がありません: ${tag}`);
  }

  // サイト内の画像はビルド結果にある。リンクカードの画像は、Astro のキャッシュから本文を戻すと
  // 落とされないことがある（ビルドは astro build --force で回す）。
  for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="(\/(?!\/)[^"?#]*)/g)) {
    if (!existsSync(join(DIST, decodeURIComponent(src))))
      fail(`${name}: 画像がビルド結果にありません: ${src}`);
  }
}

if (errors.length > 0) {
  console.error(`ビルド結果の検査で ${errors.length} 件の問題が見つかりました。`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`ビルド結果の検査に通りました（HTML ${htmlFiles(DIST).length} 件）。`);
