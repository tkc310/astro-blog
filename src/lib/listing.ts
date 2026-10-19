// 一覧に使う、純粋な計算（年でまとめる・ページ送り・前後の記事）。
// Astro に依存させず、テストできる形にしておく。

import { yearOf } from "./format";

/** 記事の一覧の n ページ目の URL。1 ページ目は /articles。 */
export function listPageHref(page: number): string {
  return page <= 1 ? "/articles" : `/articles/page/${page}`;
}

export interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

/** 新しい順に並んだ一覧を、1 ページ perPage 件に切る。 */
export function slicePage<T>(items: readonly T[], page: number, perPage: number): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: current, totalPages };
}

/** 新しい順の一覧で、ひとつ古い記事（前の記事）と新しい記事（次の記事）。 */
export function neighbors<T extends { id: string }>(
  items: readonly T[],
  id: string,
): { older?: T; newer?: T } {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return {};
  return { older: items[index + 1], newer: index > 0 ? items[index - 1] : undefined };
}

export interface YearGroup<T> {
  year: number;
  items: T[];
}

/** 新しい順に並んだ記事を、公開した年（日本時間）でまとめる。並びは保つ。 */
export function groupByYear<T extends { data: { pubDate: Date } }>(
  items: readonly T[],
): YearGroup<T>[] {
  const groups: YearGroup<T>[] = [];
  for (const item of items) {
    const year = yearOf(item.data.pubDate);
    const last = groups.at(-1);
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}
