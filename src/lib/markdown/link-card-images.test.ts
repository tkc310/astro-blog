import { describe, expect, test } from "vite-plus/test";

import { addLinkCardImageAttributes, thumbnailPath } from "./link-card-images";

describe("addLinkCardImageAttributes", () => {
  test("リンクカードのサムネイルに大きさと遅延読み込みを付ける", () => {
    const html =
      '<img src="/remark-link-card-plus/a.jpg" class="remark-link-card-plus__image" alt="">';
    expect(addLinkCardImageAttributes(html)).toBe(
      '<img src="/remark-link-card-plus/a.jpg" class="remark-link-card-plus__image" alt="" width="240" height="126" loading="lazy" decoding="async">',
    );
  });

  test("ファビコンなど、ほかの画像は変えない", () => {
    const html =
      '<img src="/a.svg" class="remark-link-card-plus__favicon" width="14" height="14" alt="">';
    expect(addLinkCardImageAttributes(html)).toBe(html);
  });
});

describe("thumbnailPath", () => {
  test("リンクカードの写真は、幅 480px の WebP に差し替える", () => {
    expect(thumbnailPath("/remark-link-card-plus/abc.png")).toBe(
      "/remark-link-card-plus/abc.w480.webp",
    );
    expect(thumbnailPath("/remark-link-card-plus/abc.JPG")).toBe(
      "/remark-link-card-plus/abc.w480.webp",
    );
  });

  test("SVG・GIF・ほかの場所の画像は差し替えない", () => {
    expect(thumbnailPath("/remark-link-card-plus/abc.svg")).toBeUndefined();
    expect(thumbnailPath("/remark-link-card-plus/abc.gif")).toBeUndefined();
    expect(thumbnailPath("/images/abc.png")).toBeUndefined();
  });
});

describe("addLinkCardImageAttributes の差し替え", () => {
  test("resolve の返す src に置き換える", () => {
    const html =
      '<img src="/remark-link-card-plus/a.png" class="remark-link-card-plus__image" alt="">';
    expect(addLinkCardImageAttributes(html, () => "/remark-link-card-plus/a.w480.webp")).toContain(
      'src="/remark-link-card-plus/a.w480.webp"',
    );
  });
});
