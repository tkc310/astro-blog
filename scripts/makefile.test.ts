// Makefile をコマンドの入口に保つための検査（ADR-0014）。
// - Makefile の公開ターゲット（`## 説明` 付き）は、AGENTS.md に `make <名前>` の形で書く
// - CI のワークフローは make で回す（vp を直接呼ばない）
// - 入れ子の make には ARGS= を付ける
// - レシピは vp を直接呼ばず、pnpm 経由（$(VP) = pnpm exec vp、pnpm run）で呼ぶ
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const makefile = read("Makefile");
const targets = [...makefile.matchAll(/^([a-zA-Z_-]+):.*## /gm)].map((match) => match[1] ?? "");

describe("Makefile", () => {
  test("公開ターゲットがある", () => {
    expect(targets).toContain("check");
    expect(targets.length).toBeGreaterThan(5);
  });

  test("公開ターゲットはすべて .PHONY に書く", () => {
    const phony =
      makefile
        .match(/^\.PHONY:(.*)$/m)?.[1]
        ?.trim()
        .split(/\s+/) ?? [];
    for (const target of targets) expect(phony, target).toContain(target);
  });

  test("公開ターゲットはすべて AGENTS.md に make の形で書く", () => {
    const agents = read("AGENTS.md");
    for (const target of targets) expect(agents, target).toContain(`make ${target}`);
  });

  test("レシピは vp を直接呼ばない（グローバルの vp に頼らない）", () => {
    const recipes = makefile.split("\n").filter((line) => line.startsWith("\t"));
    for (const line of recipes) expect(line.trim()).not.toMatch(/^@?vp\s/);
    expect(makefile).toMatch(/^VP := pnpm exec vp$/m);
  });

  test("入れ子の make には ARGS= を付ける", () => {
    const nested = makefile.split("\n").filter((line) => line.includes("$(MAKE) "));
    for (const line of nested) expect(line, line.trim()).toMatch(/\bARGS=\s*$/);
  });
});

describe("GitHub Actions", () => {
  const dir = new URL("../.github/workflows/", import.meta.url);
  const workflows = readdirSync(dir).filter((name) => name.endsWith(".yml"));

  test.each(workflows)("%s は vp を直接呼ばず make で回す", (name) => {
    const runs = readFileSync(new URL(name, dir), "utf8")
      .split("\n")
      .filter((line) => /^\s*run:/.test(line));
    for (const line of runs) expect(line.trim()).not.toMatch(/(^|\s)vp\s/);
  });
});
