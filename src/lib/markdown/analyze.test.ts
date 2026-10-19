import { describe, expect, test } from "vite-plus/test";

import { citations, codeBlocks, wordCount } from "./analyze";

const body = `はじめに [Astro](https://astro.build/) を使う。

https://docs.astro.build/

\`\`\`ts title="src/foo.ts"
const url = "https://example.com/";
\`\`\`

\`\`\`
plain
\`\`\`

- 箇条書きの https://inline.example.com/ はカードにしない
`;

describe("codeBlocks", () => {
  test("言語名とファイル名を取り、言語名の無いものは text にする", () => {
    expect(codeBlocks(body)).toEqual([
      { language: "ts", name: "src/foo.ts" },
      { language: "text" },
    ]);
  });
});

describe("citations", () => {
  test("リンクカードと文中の外部リンクを取り、コードの中の URL は取らない", () => {
    expect(citations(body)).toEqual([
      { url: "https://docs.astro.build/" },
      { url: "https://astro.build/", name: "Astro" },
    ]);
  });

  test("同じ URL は 1 つにまとめる", () => {
    expect(citations("[a](https://a.example/) と [b](https://a.example/)")).toEqual([
      { url: "https://a.example/", name: "a" },
    ]);
  });
});

describe("wordCount", () => {
  test("コード・URL・記号・空白を除いて数える", () => {
    expect(
      wordCount("## 見出し\n\n本文 [リンク](https://a.example/) です。\n\n```ts\ncode\n```"),
    ).toBe("見出し本文リンクです。".length);
  });
});
