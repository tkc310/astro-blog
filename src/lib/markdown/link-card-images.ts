import type { Node } from "unist";
import { visit } from "unist-util-visit";

/** 生の HTML のノード（rehype の raw）。 */
interface Raw extends Node {
  type: "raw";
  value: string;
}

const isRaw = (node: Node): node is Raw => node.type === "raw";

// remark-link-card-plus はカードを HTML の文字列（raw）で出すので、文字列のまま書き足す。
const IMAGE = /<img (src="[^"]*") class="remark-link-card-plus__image" alt="">/g;

/**
 * リンクカードのサムネイルに大きさと遅延読み込みを付ける。
 * 枠の大きさは CSS で固定し、画像の比率がまちまちでもレイアウトがずれないようにする（rules/seo.md の性能）。
 */
export function addLinkCardImageAttributes(html: string): string {
  return html.replace(
    IMAGE,
    '<img $1 class="remark-link-card-plus__image" alt="" width="240" height="126" loading="lazy" decoding="async">',
  );
}

export function rehypeLinkCardImages() {
  return (tree: Node) => {
    visit(tree, isRaw, (node) => {
      node.value = addLinkCardImageAttributes(node.value);
    });
  };
}
