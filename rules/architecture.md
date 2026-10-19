# 構成の規則

すべてのページはビルド時に作る。Astro は `output: 'static'` で、サーバで描画するページ、アダプター、`prerender = false` は置かない。動的に動くのは CMS の認証の Worker（`sveltia-cms-auth`）だけで、ブログ本体の Worker にコードは書かない。

記事はリポジトリの Markdown が正本だ。外部の CMS やデータベースを置かず、ビルド中に記事を外部 API から取らない。ビルド中に外部へ取りに行ってよいのは、リンクカードの OGP だけで、取れなくてもビルドを止めない。

React・Vue・Svelte などの UI フレームワークとアイランド（`client:*`）は使わない。クライアント JS は、目次の現在位置の強調、コードブロックのコピーボタン、About の LAPRAS の活動一覧の取得（ADR-0012）だけだ。JS を実行しない宣言（Speculation Rules の `<script type="speculationrules">`、JSON-LD）はこれに数えない（ADR-0016）。それ以上を足すなら ADR に理由を書く。クライアントで取得して表示するものは、取得前から高さを確保し、取れなくてもページの他の部分を壊さない。動きのある部品は、先に HTML と CSS（`popover`・`<dialog>`・`<details>`・`@view-transition`）で作れないかを考える。

スタイルはコンポーネントの `<style>` に書き、色・余白・文字の大きさは `:root` の CSS 変数を使う。CSS フレームワークは入れない。日本語の Web フォントは読み込まない。見た目は白地だけで、ダークモードと表示の切り替えは置かない（ADR-0016）。

記事の URL は `/articles/<id>` で、末尾にスラッシュを付けない（`trailingSlash: 'never'`・`build.format: 'file'`）。公開済みの URL を変えたら、`_redirects` に 301 を書く。

コマンドは `make` で実行する（ADR-0014）。新しいコマンドは `Makefile` に `## 説明` 付きで足し、`AGENTS.md` と `CONTRIBUTING.md` に `make <名前>` の形で書く。CI も `make` で回し、`vp` を直接呼ばない。

秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）はコードに書かず、コミットしない。`.env` だけに置く。
