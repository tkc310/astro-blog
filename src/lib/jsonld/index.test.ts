import { describe, expect, test } from "vite-plus/test";

import { articleGraph, commonNodes, ids, listGraph, profileGraph } from ".";

type Node = Record<string, unknown>;
const nodesOf = (graph: { "@graph": unknown }) => graph["@graph"] as Node[];
const types = (graph: { "@graph": unknown }) => nodesOf(graph).map((node) => node["@type"]);
const find = (graph: { "@graph": unknown }, type: string) =>
  nodesOf(graph).find((node) => node["@type"] === type) as Node;

// rules/seo.md の表と同じ。項目を変えたら、ここと rules/seo.md の両方を直す。
const COMMON = ["WebSite", "Blog", "Person"];

describe("commonNodes", () => {
  test("固定の @id を持ち、互いを @id で参照する", () => {
    const [website, blog, person] = commonNodes();
    expect(website).toMatchObject({ "@id": ids.website, publisher: { "@id": ids.person } });
    expect(blog).toMatchObject({ "@id": ids.blog, isPartOf: { "@id": ids.website } });
    expect(Object.keys(person).sort()).toEqual(
      ["@id", "@type", "alternateName", "description", "image", "name", "sameAs", "url"].sort(),
    );
    expect(person).toMatchObject({ url: "https://tkc310.com/about" });
  });
});

describe("articleGraph", () => {
  const graph = articleGraph({
    path: "/articles/hello",
    title: "題名",
    description: "説明",
    pubDate: new Date("2026-10-18T15:00:00Z"),
    category: { name: "フロントエンド", path: "/articles/categories/frontend" },
    body: '本文 [Astro](https://astro.build/)\n\n```ts title="a.ts"\nx\n```\n',
  });

  test("WebPage・BlogPosting・BreadcrumbList と共通の 3 ノードを出す", () => {
    expect(types(graph)).toEqual(["WebPage", "BlogPosting", "BreadcrumbList", ...COMMON]);
  });

  test("BlogPosting に rules/seo.md の項目をすべて入れる", () => {
    const posting = find(graph, "BlogPosting");
    for (const key of [
      "headline",
      "description",
      "url",
      "mainEntityOfPage",
      "isPartOf",
      "datePublished",
      "dateModified",
      "author",
      "publisher",
      "copyrightHolder",
      "copyrightYear",
      "image",
      "thumbnailUrl",
      "articleSection",
      "keywords",
      "inLanguage",
      "isAccessibleForFree",
      "wordCount",
      "hasPart",
      "citation",
    ]) {
      expect(posting, key).toHaveProperty(key);
    }
    expect(posting).toMatchObject({
      "@id": "https://tkc310.com/articles/hello#article",
      datePublished: "2026-10-19T00:00:00+09:00",
      dateModified: "2026-10-19T00:00:00+09:00",
      copyrightYear: 2026,
      hasPart: [{ "@type": "SoftwareSourceCode", programmingLanguage: "ts", name: "a.ts" }],
      citation: [{ "@type": "CreativeWork", url: "https://astro.build/", name: "Astro" }],
    });
    expect(posting).not.toHaveProperty("timeRequired");
    expect(posting).not.toHaveProperty("license");
  });

  test("パンくずはホーム › カテゴリ › 記事", () => {
    const crumbs = find(graph, "BreadcrumbList").itemListElement as Node[];
    expect(crumbs.map((crumb) => crumb.item)).toEqual([
      "https://tkc310.com/",
      "https://tkc310.com/articles/categories/frontend",
      "https://tkc310.com/articles/hello",
    ]);
  });
});

describe("listGraph", () => {
  test("記事一覧は CollectionPage・ItemList と共通の 3 ノード", () => {
    const graph = listGraph({
      path: "/",
      name: "記事",
      description: "一覧",
      items: ["/articles/a"],
    });
    expect(types(graph)).toEqual(["CollectionPage", "ItemList", ...COMMON]);
    expect(find(graph, "ItemList").itemListElement).toEqual([
      { "@type": "ListItem", position: 1, url: "https://tkc310.com/articles/a" },
    ]);
  });

  test("カテゴリは BreadcrumbList も出す", () => {
    const graph = listGraph({
      path: "/articles/categories/frontend",
      name: "フロントエンド",
      description: "説明",
      items: [],
      breadcrumb: true,
    });
    expect(types(graph)).toEqual(["CollectionPage", "ItemList", "BreadcrumbList", ...COMMON]);
  });
});

describe("profileGraph", () => {
  test("ProfilePage の mainEntity は Person", () => {
    const graph = profileGraph({ path: "/about", name: "私について", description: "自己紹介" });
    expect(types(graph)).toEqual(["ProfilePage", ...COMMON]);
    expect(find(graph, "ProfilePage").mainEntity).toEqual({ "@id": ids.person });
  });
});
