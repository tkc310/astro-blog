import { describe, expect, test } from "vite-plus/test";

import { isVisible, shouldShowDrafts } from "./drafts";

describe("shouldShowDrafts", () => {
  test("本番ブランチのビルドでは下書きを出さない", () => {
    expect(shouldShowDrafts({ WORKERS_CI_BRANCH: "main" })).toBe(false);
  });

  test("ほかのブランチのビルド（プレビュー）では下書きを出す", () => {
    expect(shouldShowDrafts({ WORKERS_CI_BRANCH: "post/hello" })).toBe(true);
  });

  test("Workers Builds の外（手元・GitHub Actions）では出さない", () => {
    expect(shouldShowDrafts({})).toBe(false);
  });

  test("SHOW_DRAFTS で上書きできる", () => {
    expect(shouldShowDrafts({ SHOW_DRAFTS: "true" })).toBe(true);
    expect(shouldShowDrafts({ SHOW_DRAFTS: "false", WORKERS_CI_BRANCH: "post/hello" })).toBe(false);
  });
});

describe("isVisible", () => {
  test("下書きは出すときだけ見える", () => {
    expect(isVisible({ data: { draft: true } }, false)).toBe(false);
    expect(isVisible({ data: { draft: true } }, true)).toBe(true);
    expect(isVisible({ data: { draft: false } }, false)).toBe(true);
  });
});
