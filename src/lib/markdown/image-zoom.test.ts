import { describe, expect, test } from "vite-plus/test";

import { type HastElement, rehypeImageZoom, wrapImages } from "./image-zoom";

const text = (value: string) => ({ type: "text", value });
const el = (
  tagName: string,
  properties: Record<string, unknown> = {},
  children: unknown[] = [],
): HastElement => ({ type: "element", tagName, properties, children }) as HastElement;
const img = (src = "../../assets/posts/a/b.png", alt = "説明") => el("img", { src, alt });
const root = (...children: unknown[]) => ({ type: "root", children }) as HastElement;

describe("wrapImages", () => {
  test("画像だけの段落を、拡大のボタンと popover に書き換える", () => {
    const tree = root(el("p", {}, [text("\n"), img(), text("\n")]));
    expect(wrapImages(tree)).toBe(1);
    const p = tree.children[0] as HastElement;
    expect(p.properties.className).toEqual(["zoom"]);
    const [trigger, dialog] = p.children as HastElement[];
    expect(trigger?.tagName).toBe("button");
    expect(trigger?.properties).toMatchObject({
      type: "button",
      popovertarget: "zoom-1",
      ariaLabel: "画像を拡大する: 説明",
    });
    expect((trigger?.children[0] as HastElement).properties.src).toBe("../../assets/posts/a/b.png");
    expect(dialog?.properties).toMatchObject({ id: "zoom-1", popover: "auto" });
    const close = dialog?.children[0] as HastElement;
    expect(close.properties).toMatchObject({
      popovertarget: "zoom-1",
      popovertargetaction: "hide",
    });
    expect((close.children[0] as HastElement).properties).toMatchObject({
      src: "../../assets/posts/a/b.png",
      alt: "説明",
      loading: "lazy",
    });
  });

  test("画像ごとに別の id を振る", () => {
    const tree = root(el("p", {}, [img("a.png")]), el("p", {}, [img("b.png")]));
    expect(wrapImages(tree)).toBe(2);
    const ids = tree.children.map(
      (p) => ((p as HastElement).children[1] as HastElement).properties.id,
    );
    expect(ids).toEqual(["zoom-1", "zoom-2"]);
  });

  test("文と並んだ画像、リンクの中の画像は書き換えない", () => {
    const tree = root(
      el("p", {}, [text("前の文 "), img()]),
      el("p", {}, [el("a", { href: "https://example.com" }, [img()])]),
      el("a", {}, [el("p", {}, [img()])]),
    );
    expect(wrapImages(tree)).toBe(0);
  });

  test("リストや引用の中の画像だけの段落も書き換える", () => {
    const tree = root(el("blockquote", {}, [el("p", {}, [img()])]));
    expect(wrapImages(tree)).toBe(1);
  });

  test("alt が空なら、ボタンの名前は「画像を拡大する」だけ", () => {
    const tree = root(el("p", {}, [img("a.png", "")]));
    rehypeImageZoom()(tree);
    const trigger = (tree.children[0] as HastElement).children[0] as HastElement;
    expect(trigger.properties.ariaLabel).toBe("画像を拡大する");
  });
});
