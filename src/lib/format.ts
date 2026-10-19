// 日付と数の書式。掲示板の見た目（docs/specs/design.md）に合わせる。

const TIME_ZONE = "Asia/Tokyo";

const parts = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

/** 2026/10/19(月) の形にする（日本時間）。 */
export function formatBbsDate(date: Date): string {
  const p = Object.fromEntries(parts.formatToParts(date).map((part) => [part.type, part.value]));
  return `${p.year}/${p.month}/${p.day}(${p.weekday})`;
}

/** <time datetime> と JSON-LD に使う、日本時間の ISO 8601（タイムゾーン付き）。 */
export function toIsoDate(date: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+09:00`;
}

/** アクセスカウンター風の 6 桁の数字にする。 */
export function toCounterDigits(value: number, width = 6): string {
  return String(Math.max(0, Math.trunc(value))).padStart(width, "0");
}

const NEW_DAYS = 14;

/** 公開から 14 日以内なら「NEW!」を付ける。 */
export function isNew(pubDate: Date, now: Date): boolean {
  const age = now.getTime() - pubDate.getTime();
  return age >= 0 && age < NEW_DAYS * 24 * 60 * 60 * 1000;
}
