import { describe, expect, test } from "vite-plus/test";

import { absoluteUrl } from "../site.config";
import { canonicalPath } from "./paths";

describe("canonicalPath", () => {
  test.each([
    ["/index.html", "/"],
    ["/", "/"],
    ["/articles/hello.html", "/articles/hello"],
    ["/articles/hello", "/articles/hello"],
    ["/about/", "/about"],
  ])("%s → %s", (input, expected) => {
    expect(canonicalPath(input)).toBe(expected);
  });
});

describe("absoluteUrl", () => {
  test("トップは末尾スラッシュ、ほかは末尾スラッシュなし", () => {
    expect(absoluteUrl("/")).toBe("https://tkc310.com/");
    expect(absoluteUrl("/articles/hello")).toBe("https://tkc310.com/articles/hello");
  });
});
