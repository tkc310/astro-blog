# astro-blog

開発者ブログのリプレイスです。microCMS + Next.js で作っていたブログ（[tkc310/microCMS_blog](https://github.com/tkc310/microCMS_blog)）を、Astro の SSG と Cloudflare に移します。

- 目的: Core Web Vitals の向上、JSON-LD による SEO・AIO の向上、Cloudflare と Astro・Vite+ のキャッチアップ
- 技術: Astro 7（SSG）・Markdown・Sveltia CMS・Vite+・Cloudflare Workers（静的アセット）

いまは計画段階で、アプリのコードはまだありません。要件は [`docs/specs/blog-replace.md`](./docs/specs/blog-replace.md)、判断の理由は [`docs/decisions/`](./docs/decisions/README.md) にあります。

AI エージェントと開発します。エージェントの入口は [`AGENTS.md`](./AGENTS.md)、人向けの手順は [`CONTRIBUTING.md`](./CONTRIBUTING.md) です。
