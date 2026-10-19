import { describe, expect, test } from "vite-plus/test";

import { addLinkCardImageAttributes } from "./link-card-images";

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
