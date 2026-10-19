// .tool-versions と package.json・pnpm-workspace.yaml のツールの版がずれていないかを確かめる。
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
  test("node・pnpm・viteplus を正確な版で書く", () => {
    for (const name of ["node", "pnpm", "viteplus"]) {
      expect(toolVersions.get(name), name).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  test("pnpm は package.json の packageManager と同じ版", () => {
    expect(pkg.packageManager).toBe(`pnpm@${toolVersions.get("pnpm")}`);
  });

  test("viteplus は package.json の vite-plus と同じ版", () => {
    expect(pkg.devDependencies?.["vite-plus"]).toBe(toolVersions.get("viteplus"));
  });

  test("pnpm-workspace.yaml の vite の置き換え先も同じ版", () => {
    expect(workspace).toContain(
      `vite@*: npm:@voidzero-dev/vite-plus-core@${toolVersions.get("viteplus")}`,
    );
  });

  test("node は package.json の engines を満たす", () => {
    const minimum = Number(pkg.engines?.node?.replace(">=", ""));
    const major = Number(toolVersions.get("node")?.split(".")[0]);
    expect(major).toBeGreaterThanOrEqual(minimum);
  });
});
