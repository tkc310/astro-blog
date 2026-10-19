import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// 記事の形式は rules/content.md。項目を足すときは Sveltia CMS の設定と指示書の表も直す。
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z
    .object({
      title: z.string().min(1).max(110),
      description: z.string().min(1).max(200),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: reference("categories"),
      draft: z.boolean().default(false),
    })
    .strict(),
});

// 旧ブログの microCMS のカテゴリの色をそのまま持つ。
export const categoryColors = [
  "blue",
  "green",
  "red",
  "pink",
  "orange",
  "yellow",
  "cyan",
  "teal",
  "purple",
  "black",
  "gray",
] as const;

const categories = defineCollection({
  loader: glob({ base: "./src/content/categories", pattern: "**/*.yml" }),
  schema: z
    .object({
      name: z.string().min(1),
      color: z.enum(categoryColors),
      description: z.string().optional(),
    })
    .strict(),
});

// 私について（/）の自己紹介。本文を Markdown で書き、ページに差し込む（docs/specs/blog-replace.md §6）。
// 1 ファイル（about.md）だけを置く。見出しは ## から。
const profile = defineCollection({
  loader: glob({ base: "./src/content/profile", pattern: "about.md" }),
  schema: z
    .object({
      /** 更新した日。画面には出さず、見直しの目安にする。 */
      updatedDate: z.coerce.date(),
    })
    .strict(),
});

export const collections = { posts, categories, profile };
