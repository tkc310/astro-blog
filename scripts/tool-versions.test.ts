// ツールの版（mise.toml・.node-version）と package.json・pnpm-workspace.yaml の版がずれていないかを確かめる（ADR-0019）。
// vp はグローバルに入れず、package.json の vite-plus を make（pnpm exec vp）から使う（ADR-0014）。
// 版を上げるときは、このテストが挙げる場所をすべて同じ版にする（CONTRIBUTING.md の「開発環境」）。
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

function path(name: string): URL {
  return new URL(`../${name}`, import.meta.url);
}

function read(name: string): string {
  return readFileSync(path(name), "utf8");
}

/** mise.toml の [tools] の `名前 = "版"` を読む。 */
const miseTools = new Map(
  [
    ...(/^\[tools\]\n([\s\S]*?)(?:^\[|(?![\s\S]))/m.exec(read("mise.toml"))?.[1] ?? "").matchAll(
      /^(\w+)\s*=\s*"([^"]*)"/gm,
    ),
  ].map(([, name = "", version = ""]) => [name, version] as const),
);

const pkg = JSON.parse(read("package.json")) as {
  packageManager?: string;
  engines?: { node?: string };
  devDependencies?: Record<string, string>;
};
const workspace = read("pnpm-workspace.yaml");

describe("mise.toml", () => {
  test("node と pnpm だけを正確な版で書く（vp はプロジェクトの vite-plus を使う）", () => {
    expect([...miseTools.keys()].toSorted()).toEqual(["node", "pnpm"]);
    for (const version of miseTools.values()) expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("node は .node-version と同じ版（GitHub Actions と Workers Builds が読む）", () => {
    expect(read(".node-version").trim()).toBe(miseTools.get("node"));
  });

  test("pnpm は package.json の packageManager と同じ版", () => {
    expect(pkg.packageManager).toBe(`pnpm@${miseTools.get("pnpm")}`);
  });

  test("node は package.json の engines を満たす", () => {
    const minimum = Number(pkg.engines?.node?.replace(">=", ""));
    const major = Number(miseTools.get("node")?.split(".")[0]);
    expect(major).toBeGreaterThanOrEqual(minimum);
  });

  test(".tool-versions を置かない（Workers Builds が asdf で読み、ビルドが止まる）", () => {
    expect(existsSync(path(".tool-versions"))).toBe(false);
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
