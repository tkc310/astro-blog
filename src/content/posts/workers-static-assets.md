---
title: Cloudflare Workers の静的アセットで末尾スラッシュなしの URL を返す
description: Astro の build.format を file にすると、Workers の静的アセットが /articles/<id> をリダイレクトなしで返せます。設定と確かめ方をまとめます。
pubDate: 2026-10-12
category: infra
---

旧ブログの URL は末尾にスラッシュが付きません。リダイレクトを挟むと表示が遅れるので、そのままの形で返す設定にしました。

## 設定

Astro では、ページを `<path>.html` で出します。

```js title="astro.config.mjs"
export default defineConfig({
  trailingSlash: "never",
  build: { format: "file" },
});
```

Workers の `html_handling` は既定の `auto-trailing-slash` のままにします。

## 確かめ方

ビルドの後に `make check-output` を実行すると、`articles/<id>/index.html` の形で出ていないかを確かめます。
