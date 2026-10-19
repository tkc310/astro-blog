# 0001 フレームワークは Astro 7 の SSG にする（EmDash・Void は採らない）

- 日付: 2026-10-19
- 状態: 採用

## 背景

旧ブログは microCMS + Next.js 12 で、Chakra UI や MDX の描画をクライアントで行っていた。リプレイスの目的は 3 つ。

- Core Web Vitals（LCP・CLS・INP）を上げる
- JSON-LD で SEO と AIO（AI 検索での引用されやすさ）を上げる
- Cloudflare と Astro・Vite+ のキャッチアップ

候補は Astro・EmDash・Void だった。

## 決定

- Astro 7（検討時点の最新は 7.4.0）を `output: 'static'` で使い、すべてのページをビルド時に作る
- EmDash と Void は採らない

## 理由

- Astro は既定でクライアント JS を出さず、コンテンツサイト向けの機能（Content Collections・画像最適化・Fonts API）がそろっている。Cloudflare 傘下で、Cloudflare 上の開発体験が厚い
- Astro 7 は Vite 8（Rolldown）と Rust 製の `.astro` コンパイラでビルドが速く、Vite+ とも版がそろう
- EmDash は Astro 上の CMS で、D1・R2・Workers を使い、記事をリクエスト時に DB から読む。SSG の方針と逆で、ベータ版であり、本文が Portable Text になって Markdown から離れる
- Void は Vite アプリ向けのデプロイ基盤（2026-10-15 発表）で、DB などのリソースを使わない静的サイトでは得るものが少ない。デプロイだけ後で試す余地はある

## 影響・トレードオフ

- 検討の途中で Astro 6 → 7 に上がった。Markdown の処理系が Sätteri（Rust）に変わったため、remark/rehype プラグインの扱いは ADR-0008 で決める
- 記事を更新するたびにビルドが要る。記事数が数百程度なら問題にならない
