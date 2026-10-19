// .tool-versions と package.json・pnpm-workspace.yaml のツールの版がずれていないかを確かめる。
// vp はグローバルに入れず、package.json の vite-plus を make（pnpm exec vp）から使う（ADR-0014）。
// 版を上げるときは、このテストが挙げる場所をすべて同じ版にする（CONTRIBUTING.md の「開発環境」）。
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const toolVersions = new Map(
  read(".tool-versions")
    .split("\n")
    .map((line) => line.replace(/#.*/, "").trim())
    .filter((line) => line !== "")
    .map((line) => {
      const [name = "", version = ""] = line.split(/\s+/);
      return [name, version] as const;
    }),
);

const pkg = JSON.parse(read("package.json")) as {
  packageManager?: string;
  engines?: { node?: string };
  devDependencies?: Record<string, string>;
};
const workspace = read("pnpm-workspace.yaml");

describe(".tool-versions", () => {
  test("node と pnpm だけを正確な版で書く（vp はプロジェクトの vite-plus を使う）", () => {
    expect([...toolVersions.keys()].toSorted()).toEqual(["node", "pnpm"]);
    for (const version of toolVersions.values()) expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("pnpm は package.json の packageManager と同じ版", () => {
    expect(pkg.packageManager).toBe(`pnpm@${toolVersions.get("pnpm")}`);
  });

  test("node は package.json の engines を満たす", () => {
    const minimum = Number(pkg.engines?.node?.replace(">=", ""));
    const major = Number(toolVersions.get("node")?.split(".")[0]);
    expect(major).toBeGreaterThanOrEqual(minimum);
  });
});

describe("vite-plus", () => {
  const version = pkg.devDependencies?.["vite-plus"] ?? "";

  test("package.json で正確な版に固定する", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("pnpm-workspace.yaml の vite の置き換え先も同じ版", () => {
    expect(workspace).toContain(`vite@*: npm:@voidzero-dev/vite-plus-core@${version}`);
  });
});
