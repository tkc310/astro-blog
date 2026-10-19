// サイト全体の設定。JSON-LD・メタタグ・About の元になる（rules/seo.md）。
// 値は microCMS の configs から移す（docs/specs/microcms-migration.md）。それまでは仮の値。

export const SITE_URL = "https://tkc310.com";

export const site = {
  url: SITE_URL,
  name: "tkc310.com",
  /** WebSite.alternateName。旧ブログの名前。 */
  alternateName: "tkc310_log",
  description: "Web エンジニア tkc310 の開発ブログ",
  language: "ja",
  perPage: 10,
  author: {
    name: "tkc310",
    handle: "tkc310",
    description: "Web エンジニア。",
    /** プロフィールの画像（public/）。私について・JSON-LD の Person.image に使う。 */
    image: { src: "/profile.webp", large: "/profile.png", width: 512, height: 512 },
    accounts: {
      github: "tkc310",
      x: "tkc310_orz",
      zenn: "tkc310",
      qiita: "tkc310",
      lapras: "tkc310",
    },
  },
  /** 既定の OGP 画像（public/）。記事ごとのアイキャッチは使わない（rules/seo.md）。 */
  ogImage: { src: "/og.png", width: 1200, height: 630 },
} as const;

export type Site = typeof site;

/** 各 SNS のプロフィール。フッターのリンクと JSON-LD の Person.sameAs に同じものを使う（rules/seo.md）。 */
export const profiles = [
  { label: "GitHub", href: `https://github.com/${site.author.accounts.github}` },
  { label: "X", href: `https://x.com/${site.author.accounts.x}` },
  { label: "Zenn", href: `https://zenn.dev/${site.author.accounts.zenn}` },
  { label: "Qiita", href: `https://qiita.com/${site.author.accounts.qiita}` },
  { label: "LAPRAS", href: `https://lapras.com/public/${site.author.accounts.lapras}` },
] as const;

/** サイト内のパスを、末尾スラッシュなしの絶対 URL にする（canonical・JSON-LD）。 */
export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : new URL(path, SITE_URL).href.replace(/\/$/, "");
}
