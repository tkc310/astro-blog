import { describe, expect, test } from "vite-plus/test";

import {
  collectImages,
  convertArticle,
  descriptionFromBody,
  emptyReport,
  fitDescription,
  hasJsx,
  labelCodeBlocks,
  normalizeHeadings,
  unwrapAutolinks,
} from "./migrate-legacy";

describe("normalizeHeadings", () => {
  test("h1 があれば全体を 1 段下げる。コードの中の # は見出しにしない", () => {
    const input = "# 大\n\n## 中\n\n```sh\n# コメント\n```";
    expect(normalizeHeadings(input)).toEqual({
      markdown: "## 大\n\n### 中\n\n```sh\n# コメント\n```",
      changed: true,
    });
  });

  test("飛ばしたレベルを詰める", () => {
    expect(normalizeHeadings("## a\n\n#### b\n\n##### c\n\n## d").markdown).toBe(
      "## a\n\n### b\n\n#### c\n\n## d",
    );
  });

  test("直すところが無ければそのまま", () => {
    expect(normalizeHeadings("## a\n\n### b")).toEqual({
      markdown: "## a\n\n### b",
      changed: false,
    });
  });
});

describe("labelCodeBlocks", () => {
  test("言語名の無いコードブロックに text を付ける", () => {
    expect(labelCodeBlocks("```\na\n```\n\n```ts\nb\n```")).toEqual({
      markdown: "```text\na\n```\n\n```ts\nb\n```",
      count: 1,
    });
  });
});

describe("collectImages", () => {
  test("<img> を Markdown の画像にし、URL と alt を集める", () => {
    const { markdown, images } = collectImages('<img src="https://x.example/a.png"  alt="図" />');
    expect(markdown).toBe("![図](https://x.example/a.png)");
    expect(images).toEqual([{ url: "https://x.example/a.png", alt: "図" }]);
  });

  test("一重引用符の <img> も直す", () => {
    expect(collectImages("<img src='https://x.example/a.png' alt='図' />").markdown).toBe(
      "![図](https://x.example/a.png)",
    );
  });
});

describe("unwrapAutolinks", () => {
  test("1 行だけの <https://...> を URL だけの行にする", () => {
    expect(unwrapAutolinks("前\n\n<https://a.example/>\n\n後")).toBe(
      "前\n\nhttps://a.example/\n\n後",
    );
  });
});

describe("hasJsx", () => {
  test("コードの外の JSX を見つけ、コードの中とインラインコードは無視する", () => {
    expect(hasJsx("<PhoneIcon size={100} />")).toBe(true);
    expect(hasJsx("```tsx\n<App />\n```\n\n`<MDXRemote>` を使う")).toBe(false);
    expect(hasJsx('<img src="a" />')).toBe(false);
  });
});

describe("descriptionFromBody", () => {
  test("本文の先頭から作り、見出し・URL・記号を除く", () => {
    expect(descriptionFromBody("## 見出し\n\nhttps://a.example/\n\n**本文**です。")).toBe(
      "本文です。",
    );
  });
});

describe("fitDescription", () => {
  test("和文の改行を詰め、欧文どうしの改行は空白にする", () => {
    expect(fitDescription("一行目。\n\n二行目 Next.js\nand React")).toEqual({
      text: "一行目。二行目 Next.js and React",
      shortened: false,
    });
  });

  test("上限を超えたら、上限までの最後の「。」で切る", () => {
    expect(fitDescription("あいう。えおかき。くけこ", 10)).toEqual({
      text: "あいう。えおかき。",
      shortened: true,
    });
  });
});

describe("convertArticle", () => {
  test("frontmatter を作り、microCMS の画像を相対パスにする", () => {
    const report = emptyReport();
    const { markdown, images } = convertArticle(
      {
        id: "abc",
        title: "題",
        excerpt: "説明",
        body: '# 見出し\n\n<img src="https://images.microcms-assets.io/assets/x/y/a.png?w=1" alt="" />',
        publishedAt: "2023-06-17T15:26:30.532Z",
        revisedAt: "2023-06-20T00:00:00.000Z",
        category: { slug: "tech", name: "技術" },
      },
      report,
    );
    expect(markdown).toBe(
      [
        "---",
        'title: "題"',
        'description: "説明"',
        "pubDate: 2023-06-17T15:26:30.532Z",
        "updatedDate: 2023-06-20T00:00:00.000Z",
        "category: tech",
        "---",
        "",
        "## 見出し",
        "",
        "![](../../assets/posts/abc/a.png)",
        "",
      ].join("\n"),
    );
    expect(images).toHaveLength(1);
    expect(report.missingAlt).toHaveLength(1);
    expect(report.headings).toEqual(["abc"]);
  });

  test("更新日が公開日と同じ日（日本時間）なら書かない", () => {
    const { markdown } = convertArticle(
      {
        id: "a",
        title: "t",
        excerpt: "d",
        body: "本文",
        publishedAt: "2023-06-17T15:26:30.532Z",
        revisedAt: "2023-06-17T15:43:40.278Z",
        category: { slug: "etc", name: "その他" },
      },
      emptyReport(),
    );
    expect(markdown).not.toContain("updatedDate");
  });
});
