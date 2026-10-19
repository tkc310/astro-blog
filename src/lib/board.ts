// 掲示板の見た目に使う、純粋な計算（No.・ページ送り・前後の記事）。
// Astro に依存させず、テストできる形にしておく。

export interface BoardPost {
  id: string;
  data: { pubDate: Date; draft: boolean };
}

/**
 * 公開日の古い順に 1 から振った No. を返す。下書きには振らない。
 * 同じ日に公開した記事は、id の順で並べる。
 */
export function numberPosts(posts: readonly BoardPost[]): Map<string, number> {
  const published = posts
    .filter((post) => !post.data.draft)
    .toSorted(
      (a, b) => a.data.pubDate.getTime() - b.data.pubDate.getTime() || a.id.localeCompare(b.id),
    );
  return new Map(published.map((post, index) => [post.id, index + 1]));
}

/** 一覧の n ページ目の URL。1 ページ目はトップ。 */
export function listPageHref(page: number): string {
  return page <= 1 ? "/" : `/articles/page/${page}`;
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

/** 新しい順の一覧で、ひとつ古い記事（前の書き込み）と新しい記事（次の書き込み）。 */
export function neighbors<T extends { id: string }>(
  items: readonly T[],
  id: string,
): { older?: T; newer?: T } {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return {};
  return { older: items[index + 1], newer: index > 0 ? items[index - 1] : undefined };
}
