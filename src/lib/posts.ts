import { getCollection, getEntry, type CollectionEntry } from "astro:content";

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

export function articlePath(id: string): string {
  return `/articles/${id}`;
}

export function categoryPath(id: string): string {
  return `/articles/categories/${id}`;
}
