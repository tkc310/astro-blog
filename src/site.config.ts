// サイト全体の設定。JSON-LD・メタタグ・About の元になる（rules/seo.md）。
// 値は microCMS の configs から移す（docs/specs/microcms-migration.md）。それまでは仮の値。

export const SITE_URL = "https://tkc310.com";

export const site = {
  url: SITE_URL,
  name: "tkc310_log",
  description: "Web エンジニア tkc310 の開発ブログ",
  language: "ja",
  perPage: 10,
  author: {
    name: "tkc310",
    handle: "tkc310",
    description: "Web エンジニア。",
    accounts: {
      github: "tkc310",
      x: "tkc310",
      zenn: "tkc310",
      qiita: "tkc310",
      lapras: "tkc310",
    },
  },
} as const;

export type Site = typeof site;
