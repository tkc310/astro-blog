// 記事の Markdown の本文から、JSON-LD に入れる値（文字数・コードブロック・引用したリンク）を取り出す。
// rules/seo.md の BlogPosting の wordCount・hasPart・citation に使う。

export interface CodeBlock {
  language: string;
  /** ```ts title="src/foo.ts" のファイル名。 */
  name?: string;
}

export interface Citation {
  url: string;
  /** 文中のリンクのテキスト。リンクカード（URL だけの行）には無い。 */
  name?: string;
}

const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

/** 見た目の 1 文字ずつに分ける（絵文字や結合文字を 1 文字に数える）。 */
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

const FENCE = /^(`{3,}|~{3,})([^\n]*)\n[\s\S]*?\n\1[ \t]*$/gm;

/** フェンスで囲んだコードブロックの言語名とファイル名。言語名の無いものは text とする。 */
export function codeBlocks(markdown: string): CodeBlock[] {
  return [...markdown.matchAll(FENCE)].map(([, , info]) => {
    const language = info.trim().split(/\s+/)[0] || "text";
    const name = /\btitle="([^"]+)"/.exec(info)?.[1];
    return name ? { language, name } : { language };
  });
}

function withoutCode(markdown: string): string {
  return markdown.replace(FENCE, "").replace(/`[^`\n]*`/g, "");
}

/** リンクカード（前後を空行で挟んだ URL だけの段落）と、文中の外部リンク。同じ URL は 1 つにまとめる。 */
export function citations(markdown: string): Citation[] {
  const text = withoutCode(markdown);
  const found = new Map<string, Citation>();
  for (const paragraph of text.split(/\n[ \t]*\n/)) {
    const line = paragraph.trim();
    if (/^https?:\/\/\S+$/.test(line) && !found.has(line)) found.set(line, { url: line });
  }
  for (const [, name, url] of text.matchAll(/(?<!!)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
    if (!found.has(url)) found.set(url, { url, name });
  }
  return [...found.values()];
}

/** 本文の文字数。コードと URL と Markdown の記号、空白を除いて数える。 */
export function wordCount(markdown: string): number {
  const text = withoutCode(markdown)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^[ \t]*(#{1,6}|[-*+]|\d+\.|>)[ \t]+/gm, "")
    .replace(/[*_~|]/g, "")
    .replace(/\s+/g, "");
  return graphemes(text).length;
}
