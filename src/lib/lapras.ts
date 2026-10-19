// LAPRAS の公開 API から活動を取る（ADR-0017）。トップ（/）をリクエストのたびにサーバで描画するときに呼ぶ。
// 形: https://github.com/lapras-inc/public-api-schema#response

export interface Activity {
  title: string;
  url: string;
  /** ISO 8601 の日時 */
  date: string;
  type: string;
}

export type ActivitiesResult = { ok: true; activities: Activity[] } | { ok: false };

export const TYPE_LABELS: Record<string, string> = {
  github: "GitHub",
  qiita: "Qiita",
  zenn: "Zenn",
  note: "note",
  blog: "ブログ",
  speaker_deck: "Speaker Deck",
  teratail: "teratail",
  connpass: "connpass",
};

export function laprasProfileUrl(account: string): string {
  return `https://lapras.com/public/${account}`;
}

export function laprasApiUrl(account: string): string {
  return `${laprasProfileUrl(account)}.json`;
}

function isActivity(value: unknown): value is Activity {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === "string" &&
    typeof item.url === "string" &&
    /^https?:\/\//.test(item.url) &&
    typeof item.date === "string" &&
    typeof item.type === "string"
  );
}

/** API の応答から、形の正しい活動だけを新しい順に `limit` 件まで返す。 */
export function parseActivities(data: unknown, limit: number): Activity[] {
  const list = (data as { activities?: unknown } | null)?.activities;
  if (!Array.isArray(list)) return [];
  return list
    .filter(isActivity)
    .toSorted((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

interface FetchOptions {
  limit?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/** 活動を取る。止まっていても、遅くても、形が違っても投げずに `{ ok: false }` を返す。 */
export async function fetchActivities(
  account: string,
  { limit = 20, timeoutMs = 3000, fetch: doFetch = fetch }: FetchOptions = {},
): Promise<ActivitiesResult> {
  try {
    const response = await doFetch(laprasApiUrl(account), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return { ok: false };
    const data: unknown = await response.json();
    if (!Array.isArray((data as { activities?: unknown } | null)?.activities)) return { ok: false };
    return { ok: true, activities: parseActivities(data, limit) };
  } catch {
    return { ok: false };
  }
}

/** `2026-10-19T12:00:00+09:00` → `2026.10.19`（API の日付のまま。時差で日をずらさない）。 */
export function formatActivityDate(date: string): string {
  return date.slice(0, 10).replaceAll("-", ".");
}
