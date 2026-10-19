// 旧ブログの microCMS のカテゴリの色をそのまま持つ。Zod スキーマ（src/content.config.ts）と
// Sveltia CMS の設定（public/admin/config.yml）の選択肢は、この一覧とそろえる。
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

export type CategoryColor = (typeof categoryColors)[number];
