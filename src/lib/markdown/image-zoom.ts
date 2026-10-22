import type { Node, Parent } from "unist";

// 本文の画像をクリックで大きく表示する（docs/specs/design.md §4）。
// JS は使わず、HTML の popover で作る（rules/architecture.md「動きのある部品は先に HTML と CSS で」）。
// 画像だけの段落（Markdown の `![alt](...)` を 1 行で書いたもの）を、次の形に書き換える。
//
//   <p class="zoom">
//     <button type="button" class="zoom-trigger" popovertarget="zoom-1" aria-label="画像を拡大する: alt">
//       <img …>                       ← 元の画像
//     </button>
//     <span class="zoom-dialog" id="zoom-1" popover>
//       <button type="button" class="zoom-close" popovertarget="zoom-1" popovertargetaction="hide" aria-label="閉じる">
//         <img … loading="lazy">     ← 同じ画像。開くまで読み込まない
//       </button>
//     </span>
//   </p>
//
// Astro の画像の処理（rehype-images）はユーザーの rehype プラグインの後に走るので、2 つの img はどちらも
// astro:assets で最適化される。リンクの中の画像と、文と並んだ画像は書き換えない。

/** hast の要素（@types/hast を入れずに使う分だけ）。 */
export interface HastElement extends Parent {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}

type HastNode = HastElement | (Node & { value?: string; children?: HastNode[] });

const isElement = (node: Node, tagName?: string): node is HastElement =>
  node.type === "element" && (tagName === undefined || (node as HastElement).tagName === tagName);

const isBlank = (node: HastNode) => node.type === "text" && (node.value ?? "").trim() === "";

/** 段落の中身が画像 1 枚だけなら、その画像を返す。 */
export function soleImage(paragraph: HastElement): HastElement | undefined {
  const content = paragraph.children.filter((child) => !isBlank(child));
  const [only] = content;
  return content.length === 1 && only && isElement(only, "img") ? only : undefined;
}

function element(
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[],
): HastElement {
  return { type: "element", tagName, properties, children };
}

/** 画像だけの段落を、拡大の popover を持つ形に書き換える。返り値は書き換えた数。 */
export function wrapImages(tree: Parent): number {
  let count = 0;

  const walk = (node: Parent) => {
    for (const child of node.children as HastNode[]) {
      if (!isElement(child)) continue;
      // リンクの中は、クリックの動きをリンクに任せる。
      if (child.tagName === "a") continue;
      const image = child.tagName === "p" ? soleImage(child) : undefined;
      if (image && typeof image.properties.src === "string") {
        count += 1;
        const id = `zoom-${count}`;
        const alt = typeof image.properties.alt === "string" ? image.properties.alt : "";
        const large = element(
          "img",
          { ...image.properties, loading: "lazy", decoding: "async" },
          [],
        );
        child.properties = { ...child.properties, className: ["zoom"] };
        child.children = [
          element(
            "button",
            {
              type: "button",
              className: ["zoom-trigger"],
              popovertarget: id,
              ariaLabel: alt ? `画像を拡大する: ${alt}` : "画像を拡大する",
            },
            [image],
          ),
          element("span", { className: ["zoom-dialog"], id, popover: "auto" }, [
            element(
              "button",
              {
                type: "button",
                className: ["zoom-close"],
                popovertarget: id,
                popovertargetaction: "hide",
                ariaLabel: "閉じる",
              },
              [large],
            ),
          ]),
        ];
        continue;
      }
      walk(child);
    }
  };

  walk(tree);
  return count;
}

/** rehype のプラグイン。 */
export function rehypeImageZoom() {
  return (tree: Parent) => {
    wrapImages(tree);
  };
}
