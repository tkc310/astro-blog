---
title: ブログを Astro と Cloudflare に引っ越しました
description: microCMS と Next.js で作っていたブログを、Astro 7 の静的サイトと Cloudflare Workers に作り直しました。引っ越しの理由と構成をまとめます。
pubDate: 2026-10-19
category: frontend
---

旧ブログは microCMS と Next.js で作っていました。表示の速さと構造化データを見直すため、Astro 7 で作り直しました。

## 構成

- Astro 7 で、すべてのページをビルド時に作る
- 記事はリポジトリの Markdown に置く
- Cloudflare Workers の静的アセットで配信する

### 検査

`make check` で、フォーマット・静的検査・テスト・ビルドを回します。

```ts title="src/lib/drafts.ts"
export function shouldShowDrafts(env: Record<string, string | undefined>): boolean {
  return env.WORKERS_CI_BRANCH !== undefined && env.WORKERS_CI_BRANCH !== "main";
}
```

## これから

見た目は、これから少しずつ作っていきます。
