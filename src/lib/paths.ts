/**
 * ページのパスを、公開する URL の形（末尾スラッシュなし、.html なし）にそろえる。
 * build.format: 'file' では /articles/x.html・/index.html の形で来る（ADR-0006）。
 */
export function canonicalPath(pathname: string): string {
  return (
    pathname
      .replace(/\.html$/, "")
      .replace(/\/index$/, "")
      .replace(/\/$/, "") || "/"
  );
}
