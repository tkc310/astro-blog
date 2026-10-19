import { describe, expect, test } from "vite-plus/test";

import { fetchActivities, formatActivityDate, laprasApiUrl, parseActivities } from "./lapras";

const activity = (date: string, title = date) => ({
  title,
  url: `https://example.com/${date}`,
  date,
  type: "zenn",
});

function fakeFetch(response: Response | Error): typeof fetch {
  return async () => {
    if (response instanceof Error) throw response;
    return response;
  };
}

describe("parseActivities", () => {
  test("新しい順に並べ、件数を絞る", () => {
    const data = {
      activities: [activity("2026-01-01"), activity("2026-03-01"), activity("2026-02-01")],
    };
    expect(parseActivities(data, 2).map((a) => a.date)).toEqual(["2026-03-01", "2026-02-01"]);
  });

  test("形の違う項目と http(s) 以外の URL を除く", () => {
    const data = {
      activities: [
        activity("2026-01-01"),
        { title: "no url", date: "2026-01-02", type: "zenn" },
        { ...activity("2026-01-03"), url: "javascript:alert(1)" },
        null,
      ],
    };
    expect(parseActivities(data, 10).map((a) => a.date)).toEqual(["2026-01-01"]);
  });

  test("activities が無ければ空", () => {
    expect(parseActivities({}, 10)).toEqual([]);
    expect(parseActivities(null, 10)).toEqual([]);
  });
});

describe("fetchActivities", () => {
  test("取れたら ok と活動を返す", async () => {
    const result = await fetchActivities("tkc310", {
      fetch: fakeFetch(Response.json({ activities: [activity("2026-10-19")] })),
    });
    expect(result).toEqual({ ok: true, activities: [activity("2026-10-19")] });
  });

  test("活動が 0 件でも ok", async () => {
    const result = await fetchActivities("tkc310", {
      fetch: fakeFetch(Response.json({ activities: [] })),
    });
    expect(result).toEqual({ ok: true, activities: [] });
  });

  test("HTTP のエラー・通信の失敗・形の違いは ok: false で、投げない", async () => {
    for (const response of [
      new Response("", { status: 500 }),
      new Error("network"),
      Response.json({ message: "not found" }),
      new Response("<html>", { status: 200 }),
    ]) {
      expect(await fetchActivities("tkc310", { fetch: fakeFetch(response) })).toEqual({
        ok: false,
      });
    }
  });

  test("公開 API の URL を呼ぶ", async () => {
    const urls: string[] = [];
    await fetchActivities("tkc310", {
      fetch: async (input) => {
        urls.push(String(input));
        return Response.json({ activities: [] });
      },
    });
    expect(urls).toEqual([laprasApiUrl("tkc310")]);
    expect(urls[0]).toBe("https://lapras.com/public/tkc310.json");
  });
});

test("formatActivityDate", () => {
  expect(formatActivityDate("2026-10-19T23:30:00+09:00")).toBe("2026.10.19");
});
