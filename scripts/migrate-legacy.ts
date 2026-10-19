// 旧ブログ（https://tkc310.com、microCMS + Next.js）の記事を、このリポジトリの Markdown に移す（ADR-0010・ADR-0018）。
// microCMS の API は使わず、公開しているページに Next.js が埋め込んだ __NEXT_DATA__ から、記事の本文（MDX のテキスト）・
// カテゴリ・日付を読む。手順と変換の表は docs/specs/microcms-migration.md。
//
// 使い方: make migrate（何度実行しても同じ結果になる。出力先を消してから書く）
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export const LEGACY_SITE = "https://tkc310.com";
const POSTS_DIR = "src/content/posts";
const CATEGORIES_DIR = "src/content/categories";
const ASSETS_DIR = "src/assets/posts";

/** 旧ブログのカテゴリには色が入っていないので、ここで決める（docs/specs/microcms-migration.md §1）。 */
export const CATEGORY_COLORS: Record<string, string> = {
  tech: "blue",
  lifehack: "green",
  book_review: "orange",
  occult: "purple",
  etc: "gray",
};

export interface LegacyArticle {
  id: string;
  title: string;
  excerpt?: string | null;
  body: string;
  publishedAt: string;
  revisedAt?: string;
  category: { slug: string; name: string };
}

export interface Report {
  /** JSX が残っていて draft: true にした記事。 */
  jsx: string[];
  /** description を本文から作った記事。 */
  generatedDescription: string[];
  /** 長すぎる description を文の切れ目で縮めた記事。 */
  shortenedDescription: string[];
  /** 言語名が無く text にしたコードブロック。 */
  unlabeledCode: string[];
  /** 見出しのレベルを直した記事。 */
  headings: string[];
  /** alt の無い画像。 */
  missingAlt: string[];
  /** 取れなかった画像。 */
  failedImages: string[];
}

export function emptyReport(): Report {
  return {
    jsx: [],
    generatedDescription: [],
    shortenedDescription: [],
    unlabeledCode: [],
    headings: [],
    missingAlt: [],
    failedImages: [],
  };
}

/** Markdown を、コードブロックとそれ以外に分ける。変換はコードブロックの外だけにかける。 */
export function splitByFence(markdown: string): { code: boolean; text: string }[] {
  const parts: { code: boolean; text: string }[] = [];
  const lines = markdown.split("\n");
  let buffer: string[] = [];
  let fence: string | undefined;
  const flush = (code: boolean) => {
    if (buffer.length > 0) parts.push({ code, text: buffer.join("\n") });
    buffer = [];
  };
  for (const line of lines) {
    const marker = /^(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence === undefined && marker) {
      flush(false);
      fence = marker;
      buffer.push(line);
    } else if (fence !== undefined && line.trim() === fence) {
      buffer.push(line);
      flush(true);
      fence = undefined;
    } else {
      buffer.push(line);
    }
  }
  flush(fence !== undefined);
  return parts;
}

function mapText(markdown: string, transform: (text: string) => string): string {
  return splitByFence(markdown)
    .map((part) => (part.code ? part.text : transform(part.text)))
    .join("\n");
}

/** 言語名の無いコードブロックに text を付ける（rules/content.md）。付けた数を返す。 */
export function labelCodeBlocks(markdown: string): { markdown: string; count: number } {
  let count = 0;
  const out = splitByFence(markdown).map((part) => {
    if (!part.code) return part.text;
    return part.text.replace(/^(`{3,}|~{3,})[ \t]*\n/, (_, fence: string) => {
      count += 1;
      return `${fence}text\n`;
    });
  });
  return { markdown: out.join("\n"), count };
}

/**
 * 見出しを ## から始め、レベルを飛ばさないようにする（rules/content.md）。
 * h1 があれば全体を 1 段下げ、前の見出しより 2 段以上深いものは 1 段深いところまで上げる。
 */
export function normalizeHeadings(markdown: string): { markdown: string; changed: boolean } {
  const parts = splitByFence(markdown);
  const pattern = /^(#{1,6})([ \t]+.*)$/gm;
  const levels = parts
    .filter((part) => !part.code)
    .flatMap((part) => [...part.text.matchAll(pattern)].map((match) => match[1].length));
  const shift = levels.some((level) => level === 1) ? 1 : 0;
  let previous = 1;
  let changed = false;
  const out = parts.map((part) => {
    if (part.code) return part.text;
    return part.text.replace(pattern, (_, hashes: string, rest: string) => {
      const wanted = Math.min(6, hashes.length + shift);
      const level = Math.max(2, Math.min(wanted, previous + 1));
      previous = level;
      if (level !== hashes.length) changed = true;
      return `${"#".repeat(level)}${rest}`;
    });
  });
  return { markdown: out.join("\n"), changed };
}

export interface ImageRef {
  url: string;
  alt: string;
}

const IMG_TAG = /<img\s+[^>]*?src=(["'])([^"']+)\1[^>]*?\/?>/g;
const MD_IMAGE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

/** 本文の画像（<img> と ![]()）を Markdown の画像にそろえ、画像の URL を集める。 */
export function collectImages(markdown: string): { markdown: string; images: ImageRef[] } {
  const images: ImageRef[] = [];
  const out = mapText(markdown, (text) =>
    text
      .replace(IMG_TAG, (tag: string, _quote: string, url: string) => {
        const alt = /\balt=(["'])(.*?)\1/.exec(tag)?.[2] ?? "";
        images.push({ url, alt });
        return `![${alt}](${url})`;
      })
      .replace(MD_IMAGE, (match: string, alt: string, url: string) => {
        if (!images.some((image) => image.url === url)) images.push({ url, alt });
        return match;
      }),
  );
  return { markdown: out, images };
}

/** 画像のファイル名（URL のクエリを外したもの）。 */
export function imageFileName(url: string): string {
  return basename(new URL(url).pathname);
}

/** 旧ブログで 1 行だけの <https://...> はリンクカードだった。URL だけの行に直す（ビルド時にリンクカードになる）。 */
export function unwrapAutolinks(markdown: string): string {
  return mapText(markdown, (text) => text.replace(/^<(https?:\/\/[^>\s]+)>[ \t]*$/gm, "$1"));
}

/** コードの外に JSX（大文字で始まる要素）・import・export が残っているか（docs/specs/microcms-migration.md §2）。 */
export function hasJsx(markdown: string): boolean {
  return splitByFence(markdown).some((part) => {
    if (part.code) return false;
    const text = part.text.replace(/`[^`\n]*`/g, "");
    return /<[A-Z][A-Za-z0-9]*[\s/>]/.test(text) || /^(import|export)\s/m.test(text);
  });
}

const graphemes = (text: string) =>
  Array.from(new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(text), (s) => s.segment);

/** 文字数の上限（Zod スキーマの description は 200 字まで）。 */
const DESCRIPTION_MAX = 200;

/**
 * description を 1 行にし、上限を超えたら上限までの最後の「。」で切る。
 * 和文の改行は詰め、欧文どうしの改行だけ空白にする。
 */
export function fitDescription(
  text: string,
  max = DESCRIPTION_MAX,
): { text: string; shortened: boolean } {
  const oneLine = text
    .trim()
    .replace(/([A-Za-z0-9.,])\s*\n+\s*([A-Za-z0-9])/g, "$1 $2")
    .replace(/\s*\n+\s*/g, "")
    .replace(/[ \t]+/g, " ");
  const chars = graphemes(oneLine);
  if (chars.length <= max) return { text: oneLine, shortened: false };
  const head = chars.slice(0, max).join("");
  const end = head.lastIndexOf("。");
  return {
    text: end > 0 ? head.slice(0, end + 1) : `${chars.slice(0, max - 1).join("")}…`,
    shortened: true,
  };
}

/** description が空のとき、本文の先頭から 120 字ほどを作る。 */
export function descriptionFromBody(markdown: string): string {
  const text = splitByFence(markdown)
    .filter((part) => !part.code)
    .map((part) => part.text)
    .join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}[ \t]+.*$/gm, "")
    .replace(/^https?:\/\/\S+$/gm, "")
    .replace(/[`*_~>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chars = graphemes(text);
  if (chars.length <= 120) return chars.join("");
  const head = chars.slice(0, 120).join("");
  const end = head.lastIndexOf("。");
  return end >= 60 ? head.slice(0, end + 1) : `${head}…`;
}

const TIME_ZONE = "Asia/Tokyo";
const dayOf = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(iso));

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export interface Converted {
  markdown: string;
  images: ImageRef[];
}

/** 1 本の記事を、frontmatter 付きの Markdown にする。画像のパスは相対パスに書き換える。 */
export function convertArticle(article: LegacyArticle, report: Report): Converted {
  let body = article.body.replace(/\r\n/g, "\n").trim();
  body = unwrapAutolinks(body);

  const collected = collectImages(body);
  body = collected.markdown;
  for (const image of collected.images) {
    if (!image.alt) report.missingAlt.push(`${article.id}: ${image.url}`);
    if (new URL(image.url).hostname === "images.microcms-assets.io") {
      body = body
        .split(image.url)
        .join(`../../assets/posts/${article.id}/${imageFileName(image.url)}`);
    }
  }

  const labeled = labelCodeBlocks(body);
  body = labeled.markdown;
  if (labeled.count > 0) report.unlabeledCode.push(`${article.id}: ${labeled.count} 個`);

  const headings = normalizeHeadings(body);
  body = headings.markdown;
  if (headings.changed) report.headings.push(article.id);

  const draft = hasJsx(body);
  if (draft) report.jsx.push(article.id);

  let description = (article.excerpt ?? "").trim();
  if (!description) {
    description = descriptionFromBody(body);
    report.generatedDescription.push(article.id);
  }
  const fitted = fitDescription(description);
  description = fitted.text;
  if (fitted.shortened) report.shortenedDescription.push(article.id);

  const lines = [
    "---",
    `title: ${yamlString(article.title.trim())}`,
    `description: ${yamlString(description)}`,
    `pubDate: ${article.publishedAt}`,
  ];
  if (article.revisedAt && dayOf(article.revisedAt) !== dayOf(article.publishedAt)) {
    lines.push(`updatedDate: ${article.revisedAt}`);
  }
  lines.push(`category: ${article.category.slug}`);
  if (draft) lines.push("draft: true");
  lines.push("---", "", body, "");

  return { markdown: lines.join("\n"), images: collected.images };
}

async function nextData(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${LEGACY_SITE}${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const html = await response.text();
  const json = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(
    html,
  )?.[1];
  if (!json) throw new Error(`${path}: __NEXT_DATA__ がありません`);
  return (JSON.parse(json) as { props: { pageProps: Record<string, unknown> } }).props.pageProps;
}

/** 一覧のページを順にたどって、公開している記事の ID を集める（サイトマップには全部が載っていない）。 */
async function articleIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; ; page++) {
    const props = await nextData(page === 1 ? "/" : `/articles/page/${page}`).catch(
      () => undefined,
    );
    const articles = props?.articles as { id: string }[] | undefined;
    if (!articles?.length) break;
    ids.push(...articles.map((article) => article.id));
  }
  return ids;
}

async function main() {
  const report = emptyReport();
  const ids = await articleIds();
  const articles: LegacyArticle[] = [];
  for (const id of ids) {
    articles.push((await nextData(`/articles/${id}`)).article as LegacyArticle);
  }

  for (const dir of [POSTS_DIR, CATEGORIES_DIR, ASSETS_DIR]) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }

  const categories = new Map<string, string>();
  let imageCount = 0;
  for (const article of articles) {
    categories.set(article.category.slug, article.category.name);
    const converted = convertArticle(article, report);
    writeFileSync(join(POSTS_DIR, `${article.id}.md`), converted.markdown);
    for (const image of converted.images) {
      if (new URL(image.url).hostname !== "images.microcms-assets.io") continue;
      const dir = join(ASSETS_DIR, article.id);
      mkdirSync(dir, { recursive: true });
      const response = await fetch(image.url).catch(() => undefined);
      if (!response?.ok) {
        report.failedImages.push(`${article.id}: ${image.url}`);
        continue;
      }
      writeFileSync(join(dir, imageFileName(image.url)), Buffer.from(await response.arrayBuffer()));
      imageCount += 1;
    }
  }

  for (const [slug, name] of [...categories].sort(([a], [b]) => a.localeCompare(b))) {
    const color = CATEGORY_COLORS[slug] ?? "gray";
    writeFileSync(join(CATEGORIES_DIR, `${slug}.yml`), `name: ${name}\ncolor: ${color}\n`);
  }

  const drafts = report.jsx.length;
  console.log(
    `公開記事 ${articles.length - drafts} 本・下書き ${drafts} 本・カテゴリ ${categories.size} 個・画像 ${imageCount} 枚`,
  );
  const sections: [string, string[]][] = [
    ["JSX が残っていて draft: true にした記事（手で Markdown に直す）", report.jsx],
    ["description を本文から作った記事", report.generatedDescription],
    ["長すぎる description を文の切れ目で縮めた記事", report.shortenedDescription],
    ["言語名が無く text にしたコードブロック", report.unlabeledCode],
    ["見出しのレベルを直した記事", report.headings],
    ["alt の無い画像", report.missingAlt],
    ["取れなかった画像", report.failedImages],
  ];
  for (const [title, items] of sections) {
    console.log(`\n## ${title}（${items.length}）`);
    for (const item of items) console.log(`- ${item}`);
  }
}

if (import.meta.main) await main();
