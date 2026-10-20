import { existsSync } from "node:fs";
import { join, parse } from "node:path";

import sharp from "sharp";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/** 生の HTML のノード（rehype の raw）。 */
interface Raw extends Node {
  type: "raw";
  value: string;
}

const isRaw = (node: Node): node is Raw => node.type === "raw";

// remark-link-card-plus はカードを HTML の文字列（raw）で出すので、文字列のまま書き足す。
const IMAGE = /<img src="([^"]*)" class="remark-link-card-plus__image" alt="">/g;

/** remark-link-card-plus が画像を保存する場所と、その公開パス。 */
const PUBLIC_DIR = "public";
const CARD_PATH = "/remark-link-card-plus/";

/** サムネイルの枠は最大 15rem（240px）。2 倍の画面のために 480px にする。 */
export const THUMBNAIL_WIDTH = 480;

/** 縮めて WebP にする画像。SVG は縮める必要が無く、GIF は動きを残すため、そのまま出す。 */
const RESIZABLE = /\.(png|jpe?g|webp|avif)$/i;

/** 縮めた画像の公開パス。元の名前（URL のハッシュ）に幅を付ける。 */
export function thumbnailPath(src: string): string | undefined {
  if (!src.startsWith(CARD_PATH) || !RESIZABLE.test(src)) return undefined;
  return `${CARD_PATH}${parse(src).name}.w${THUMBNAIL_WIDTH}.webp`;
}

/**
 * リンクカードのサムネイルに大きさと遅延読み込みを付け、src を縮めた画像に差し替える。
 * 枠の大きさは CSS で固定し、画像の比率がまちまちでもレイアウトがずれないようにする（rules/seo.md の性能）。
 */
export function addLinkCardImageAttributes(
  html: string,
  resolve: (src: string) => string = (src) => src,
): string {
  return html.replace(
    IMAGE,
    (_, src: string) =>
      `<img src="${resolve(src)}" class="remark-link-card-plus__image" alt="" width="240" height="126" loading="lazy" decoding="async">`,
  );
}

/**
 * OGP の画像は数百 KB〜数 MB のことがあり、そのまま出すと LCP が遅れる（1.5MB の PNG で 9 秒になった）。
 * 幅 480px の WebP を作り、作れなければ元の画像を出す。
 */
async function resizeThumbnail(src: string): Promise<string> {
  const output = thumbnailPath(src);
  if (!output) return src;
  const target = join(PUBLIC_DIR, output);
  if (existsSync(target)) return output;
  try {
    await sharp(join(PUBLIC_DIR, src))
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(target);
    return output;
  } catch {
    return src;
  }
}

export function rehypeLinkCardImages() {
  return async (tree: Node) => {
    const nodes: Raw[] = [];
    visit(tree, isRaw, (node) => {
      nodes.push(node);
    });
    for (const node of nodes) {
      const resolved = new Map<string, string>();
      for (const [, src = ""] of node.value.matchAll(IMAGE)) {
        resolved.set(src, await resizeThumbnail(src));
      }
      node.value = addLinkCardImageAttributes(node.value, (src) => resolved.get(src) ?? src);
    }
  };
}
