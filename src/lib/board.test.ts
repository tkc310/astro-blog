import { describe, expect, test } from "vite-plus/test";

import { listPageHref, neighbors, numberPosts, slicePage } from "./board";

const post = (id: string, date: string, draft = false) => ({
  id,
  data: { pubDate: new Date(date), draft },
});

describe("numberPosts", () => {
  test("公開日の古い順に 1 から振る", () => {
    const numbers = numberPosts([
      post("c", "2026-03-01"),
      post("a", "2026-01-01"),
      post("b", "2026-02-01"),
    ]);
    expect([numbers.get("a"), numbers.get("b"), numbers.get("c")]).toEqual([1, 2, 3]);
  });

  test("下書きには振らず、公開した記事の番号を詰めない", () => {
    const numbers = numberPosts([
      post("a", "2026-01-01"),
      post("draft", "2026-01-15", true),
      post("b", "2026-02-01"),
    ]);
    expect(numbers.get("draft")).toBeUndefined();
    expect(numbers.get("b")).toBe(2);
  });

  test("同じ日の記事は id の順", () => {
    const numbers = numberPosts([post("b", "2026-01-01"), post("a", "2026-01-01")]);
    expect([numbers.get("a"), numbers.get("b")]).toEqual([1, 2]);
  });
});

describe("listPageHref", () => {
  test("1 ページ目はトップ、2 ページ目からは /articles/page/<n>", () => {
    expect(listPageHref(1)).toBe("/");
    expect(listPageHref(2)).toBe("/articles/page/2");
  });
});

describe("slicePage", () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  test("1 ページ perPage 件に切り、ページ数を返す", () => {
    expect(slicePage(items, 3, 10)).toEqual({
      items: [20, 21, 22, 23, 24],
      page: 3,
      totalPages: 3,
    });
  });

  test("記事が無くても 1 ページある", () => {
    expect(slicePage([], 1, 10)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});

describe("neighbors", () => {
  const list = [{ id: "new" }, { id: "mid" }, { id: "old" }];

  test("前（古い）と次（新しい）を返す", () => {
    expect(neighbors(list, "mid")).toEqual({ older: { id: "old" }, newer: { id: "new" } });
  });

  test("端では片方だけ", () => {
    expect(neighbors(list, "new")).toEqual({ older: { id: "mid" }, newer: undefined });
    expect(neighbors(list, "old")).toEqual({ older: undefined, newer: { id: "mid" } });
  });
});
