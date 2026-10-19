// /llms.txt: AI 向けに、記事のタイトル・URL・概要を並べる（docs/specs/blog-replace.md §4）。下書きは入れない。
import type { APIRoute } from "astro";

import { articlePath, getPublishedPosts } from "../lib/posts";
import { absoluteUrl, site } from "../site.config";

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `- [私について](${absoluteUrl("/about")}): ${site.author.name} の自己紹介と、最近の活動`,
    "",
    "## 記事",
    "",
    ...posts.map(
      (post) =>
        `- [${post.data.title}](${absoluteUrl(articlePath(post.id))}): ${post.data.description}`,
    ),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
