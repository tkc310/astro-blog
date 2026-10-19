import { describe, expect, test } from "vite-plus/test";

import { formatDate, toIsoDate, yearOf } from "./format";

describe("formatDate", () => {
  test("2026.10.19 の形で出す", () => {
    expect(formatDate(new Date("2026-10-19T00:00:00+09:00"))).toBe("2026.10.19");
  });

  test("UTC の前日の夜は、日本時間の翌日になる", () => {
    expect(formatDate(new Date("2026-10-18T16:00:00Z"))).toBe("2026.10.19");
  });
});

describe("yearOf", () => {
  test("日本時間の年を返す", () => {
    expect(yearOf(new Date("2025-12-31T16:00:00Z"))).toBe(2026);
  });
});

describe("toIsoDate", () => {
  test("日本時間のタイムゾーン付きで出す", () => {
    expect(toIsoDate(new Date("2026-10-19T00:00:00Z"))).toBe("2026-10-19T09:00:00+09:00");
  });
});
