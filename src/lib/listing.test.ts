import { describe, expect, test } from "vite-plus/test";

import { groupByYear, listPageHref, neighbors, slicePage } from "./listing";

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

describe("groupByYear", () => {
  const post = (id: string, date: string) => ({ id, data: { pubDate: new Date(date) } });

  test("新しい順のまま、年ごとにまとめる", () => {
    const groups = groupByYear([
      post("c", "2026-03-01T00:00:00+09:00"),
      post("b", "2026-01-01T00:00:00+09:00"),
      post("a", "2025-12-01T00:00:00+09:00"),
    ]);
    expect(groups.map((group) => [group.year, group.items.map((item) => item.id)])).toEqual([
      [2026, ["c", "b"]],
      [2025, ["a"]],
    ]);
  });

  test("年は日本時間で決める（UTC の大晦日の夜は日本の元日）", () => {
    const [group] = groupByYear([post("a", "2025-12-31T16:00:00Z")]);
    expect(group?.year).toBe(2026);
  });

  test("記事が無ければ空", () => {
    expect(groupByYear([])).toEqual([]);
  });
});
