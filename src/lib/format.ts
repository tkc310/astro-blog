// 日付の書式（日本時間）。docs/specs/design.md §2。

const TIME_ZONE = "Asia/Tokyo";

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsOf(date: Date): Record<string, string> {
  return Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]));
}

/** 2026.10.19 の形にする。 */
export function formatDate(date: Date): string {
  const p = partsOf(date);
  return `${p.year}.${p.month}.${p.day}`;
}

/** 日本時間の年（JSON-LD の copyrightYear などに使う）。 */
export function yearOf(date: Date): number {
  return Number(partsOf(date).year);
}

/** <time datetime> と JSON-LD に使う、日本時間の ISO 8601（タイムゾーン付き）。 */
export function toIsoDate(date: Date): string {
  const p = partsOf(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+09:00`;
}
