// Worker で描くページ（prerender = false）は、ADR に書いたものだけにする（rules/architecture.md・ADR-0017）。
// 足すときは ADR を書き、ここの一覧にも足す。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vite-plus/test";

const ALLOWED = ["about.astro"];

const pagesDir = fileURLToPath(new URL("../src/pages/", import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("Worker で描くページは許したものだけ", () => {
  const onDemand = files(pagesDir)
    .filter((path) => /export\s+const\s+prerender\s*=\s*false/.test(readFileSync(path, "utf8")))
    .map((path) => relative(pagesDir, path))
    .toSorted();
  expect(onDemand).toEqual(ALLOWED);
});
