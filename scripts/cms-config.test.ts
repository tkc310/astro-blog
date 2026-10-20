// Sveltia CMS の設定（public/admin/config.yml）と Zod スキーマ（src/content.config.ts）が
// 同じ項目を持つかの検査（rules/content.md・ADR-0004）。片方だけ直すと、CMS で保存した記事がビルドで落ちる。
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";
import { parse } from "yaml";

import { categoryColors } from "../src/lib/category-colors";

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

interface Field {
  name: string;
  required?: boolean;
  options?: string[];
}
interface Collection {
  name: string;
  folder?: string;
  fields?: Field[];
  files?: { name: string; file: string; fields: Field[] }[];
}

const config = parse(read("public/admin/config.yml")) as {
  backend: { base_url?: string };
  collections: Collection[];
};
const contentConfig = read("src/content.config.ts");

/** content.config.ts の defineCollection の z.object の項目名（optional/default 付きかどうか）。 */
function schemaFields(name: string): Map<string, boolean> {
  const block = new RegExp(`const ${name} = defineCollection\\(\\{([\\s\\S]*?)\\n\\}\\);`).exec(
    contentConfig,
  )?.[1];
  if (!block) throw new Error(`${name} の defineCollection がありません`);
  const fields = new Map<string, boolean>();
  for (const [, key, rest] of block.matchAll(/^\s+(\w+): (z\.[^\n]*|reference\([^\n]*)$/gm)) {
    fields.set(key, !/\.optional\(\)|\.default\(/.test(rest));
  }
  return fields;
}

function cmsFields(fields: Field[]): Map<string, boolean> {
  return new Map(
    fields
      .filter((field) => field.name !== "body")
      .map((field) => [field.name, field.required !== false]),
  );
}

const collection = (name: string) => {
  const found = config.collections.find((item) => item.name === name);
  if (!found) throw new Error(`config.yml に ${name} がありません`);
  return found;
};

describe("Sveltia CMS の設定", () => {
  test("認証の Worker（sveltia-cms-auth）を https の origin で指す", () => {
    const url = new URL(config.backend.base_url ?? "");
    expect(url.protocol).toBe("https:");
    expect(url.href).toBe(`${url.origin}/`);
  });

  test("記事の項目と必須かどうかが Zod スキーマと同じ", () => {
    const posts = collection("posts");
    expect(posts.folder).toBe("src/content/posts");
    expect(cmsFields(posts.fields ?? [])).toEqual(schemaFields("posts"));
  });

  test("カテゴリの項目と色の選択肢が Zod スキーマと同じ", () => {
    const categories = collection("categories");
    expect(categories.folder).toBe("src/content/categories");
    expect(cmsFields(categories.fields ?? [])).toEqual(schemaFields("categories"));
    const color = categories.fields?.find((field) => field.name === "color");
    expect(color?.options).toEqual([...categoryColors]);
  });

  test("私についての項目が Zod スキーマと同じ", () => {
    const about = collection("pages").files?.find((file) => file.name === "about");
    expect(about?.file).toBe("src/content/profile/about.md");
    expect(cmsFields(about?.fields ?? [])).toEqual(schemaFields("profile"));
  });
});
