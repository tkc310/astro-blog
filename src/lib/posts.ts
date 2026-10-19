import { getCollection, type CollectionEntry } from "astro:content";

import { isVisible, shouldShowDrafts } from "./drafts";

export type Post = CollectionEntry<"posts">;

const showDrafts = shouldShowDrafts(process.env);

/** 公開してよい記事を新しい順に返す。プレビューのビルドでは下書きも含める。 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", (entry) => isVisible(entry, showDrafts));
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function articlePath(id: string): string {
  return `/articles/${id}`;
}
