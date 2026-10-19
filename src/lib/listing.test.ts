import { describe, expect, test } from "vite-plus/test";

import { listPageHref, neighbors, slicePage } from "./listing";

describe("listPageHref", () => {
  test("1 ページ目は /articles、2 ページ目からは /articles/page/<n>", () => {
    expect(listPageHref(1)).toBe("/articles");
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
