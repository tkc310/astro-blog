import { getCollection, getEntry, type CollectionEntry } from "astro:content";

import { numberPosts } from "./board";
import { isVisible, shouldShowDrafts } from "./drafts";

export type Post = CollectionEntry<"posts">;
export type Category = CollectionEntry<"categories">;

const showDrafts = shouldShowDrafts(process.env);

/** 公開してよい記事を新しい順に返す。プレビューのビルドでは下書きも含める。 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", (entry) => isVisible(entry, showDrafts));
  return posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id),
  );
}

export async function getCategories(): Promise<Category[]> {
  const categories = await getCollection("categories");
  return categories.sort((a, b) => a.data.name.localeCompare(b.data.name, "ja"));
}

export async function getCategory(post: Post): Promise<Category> {
  const category = await getEntry(post.data.category);
  if (!category)
    throw new Error(`記事 ${post.id} のカテゴリ ${post.data.category.id} がありません`);
  return category;
}

/** 掲示板の No.（公開日の古い順の連番）。下書きは undefined。 */
export async function getPostNumbers(): Promise<Map<string, number>> {
  return numberPosts(await getPosts());
}

/** いちばん新しい公開日または更新日（「最終更新日」に使う）。 */
export function lastUpdated(posts: readonly Post[]): Date | undefined {
  const times = posts.map((post) => (post.data.updatedDate ?? post.data.pubDate).getTime());
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}

export function articlePath(id: string): string {
  return `/articles/${id}`;
}

export function categoryPath(id: string): string {
  return `/articles/categories/${id}`;
}
