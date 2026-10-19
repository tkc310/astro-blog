import { describe, expect, test } from "vite-plus/test";

import { formatBbsDate, isNew, toCounterDigits, toIsoDate } from "./format";

describe("formatBbsDate", () => {
  test("日本時間の日付と曜日で出す", () => {
    expect(formatBbsDate(new Date("2026-10-19T00:00:00+09:00"))).toBe("2026/10/19(月)");
  });

  test("UTC の前日の夜は、日本時間の翌日になる", () => {
    expect(formatBbsDate(new Date("2026-10-18T16:00:00Z"))).toBe("2026/10/19(月)");
  });
});

describe("toIsoDate", () => {
  test("日本時間のタイムゾーン付きで出す", () => {
    expect(toIsoDate(new Date("2026-10-19T00:00:00Z"))).toBe("2026-10-19T09:00:00+09:00");
  });
});

describe("toCounterDigits", () => {
  test("6 桁に 0 で詰める", () => {
    expect(toCounterDigits(12)).toBe("000012");
  });

  test("桁が多ければそのまま出す", () => {
    expect(toCounterDigits(1234567)).toBe("1234567");
  });
});

describe("isNew", () => {
  const now = new Date("2026-10-19T00:00:00Z");

  test("14 日以内なら NEW", () => {
    expect(isNew(new Date("2026-10-06T00:00:00Z"), now)).toBe(true);
  });

  test("14 日を過ぎたら NEW ではない", () => {
    expect(isNew(new Date("2026-10-05T00:00:00Z"), now)).toBe(false);
  });

  test("未来の日付は NEW ではない", () => {
    expect(isNew(new Date("2026-10-20T00:00:00Z"), now)).toBe(false);
  });
});
