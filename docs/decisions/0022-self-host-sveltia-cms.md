# 0022 管理画面の本体（Sveltia CMS）は npm のパッケージから自分で配り、CSP で読み込み先を絞る

- 日付: 2026-10-20
- 状態: 採用

## 背景

管理画面（ADR-0004）は、`public/admin/index.html` が unpkg から Sveltia CMS の本体（`@sveltia/cms@0.228.0/dist/sveltia-cms.js`）を読み込んで動いていた。この本体は、ログインした人の GitHub のトークン（`repo` 権限）を持って動く。

版を固定していても、npm が守るのは「同じ版を上書きできない」ことだけで、配信元（unpkg）が乗っ取られたり、途中で中身が変わったりすると、ブラウザは確かめずに実行する。差し替えられた本体は、トークンを外に送ったり、リポジトリに書き込んで本番に出したりできる。また、CDN 版の本体は、日本語の翻訳・Shiki・PDF.js などを実行中に unpkg から追加で読み込むので、配信元が止まると管理画面も動かない。

## 決定

- `@sveltia/cms` を `package.json` の `dependencies` に正確な版で入れる。版を上げるときは PR を出し、CI とプレビューで管理画面を確かめてからマージする
- 管理画面を `src/pages/admin.astro`（`/admin`）にし、`<script>` で `@sveltia/cms` の `init()` を呼ぶ。Astro（Vite）がまとめ、`/_astro/` からこのサイトのファイルとして配る。翻訳や Shiki なども同じく自分のサイトから配られる
- ページは `build.format: 'file'` で `admin.html` になるので、設定の場所を `<link rel="cms-config-url" href="/admin/config.yml">` で示す。設定は今までどおり `public/admin/config.yml`
- `public/_headers` で `/admin` に Content-Security-Policy を付ける。スクリプトは `'self'` だけ（インラインも外部も不可）、通信は自分のサイトと GitHub（`api.github.com`・`*.githubusercontent.com`・`www.githubstatus.com`）だけ。スタイルだけ、Sveltia CMS が部品のスタイルを差し込むので `'unsafe-inline'` を許す
- `make check-output` が、`admin.html` に外部やインラインのスクリプトが無いこと、`_headers` の `/admin` の `script-src` が `'self'` だけであることを確かめる。`scripts/cms-config.test.ts` が、版の固定と、ページが CDN を読まないことを確かめる
- `rules/architecture.md` のクライアント JS の許可に、管理画面の Sveltia CMS を足す（ブログのページには載らない）

## 理由

- 本体の中身が、ロックファイルのハッシュで確かめた npm のパッケージと同じになる。配信元を信じる必要が無い
- 万一本体に悪いコードが入っても、CSP がこのサイトと GitHub 以外への通信と外部のスクリプトを止める
- 版の更新が、ほかの依存と同じ流れ（`make outdated`・PR・CI・プレビュー）になる
- SRI（`integrity`）だけだと書き換えは防げるが、CDN 版が実行中に追加で読み込むファイルは守れず、配信元が止まると開けないのも変わらない

## 影響・トレードオフ

- 管理画面の URL が `/admin/` から `/admin` になる（末尾スラッシュなしの方針、ADR-0006 にそろう）。`/admin/` は Workers の静的アセットが `/admin` へリダイレクトする
- ビルドが Sveltia CMS をまとめるぶん長くなり、`/_astro/` に大きなファイルが増える。読むのは管理画面だけで、ブログのページの速さには影響しない
- Sveltia CMS が新しい通信先（地図のタイルなど）を使う機能を足すと、CSP に止められる。使うときは `_headers` に足す
- ADR-0004 の「`/admin/` に静的ページとして置く」はこの ADR に置き換える
