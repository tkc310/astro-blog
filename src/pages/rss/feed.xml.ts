// RSS（/rss/feed.xml）。旧ブログと同じ URL（ADR-0006）。下書きは入れない。
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

import { articlePath, getPublishedPosts } from "../../lib/posts";
import { site, SITE_URL } from "../../site.config";

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  return rss({
    title: site.name,
    description: site.description,
    site: SITE_URL,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: articlePath(post.id),
    })),
    customData: `<language>${site.language}</language>`,
  });
};
