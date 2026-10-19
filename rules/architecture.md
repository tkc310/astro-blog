# 構成の規則

すべてのページはビルド時に作る。Astro は `output: 'static'` で、サーバで描画するページ、アダプター、`prerender = false` は置かない。動的に動くのは CMS の認証の Worker（`sveltia-cms-auth`）だけで、ブログ本体の Worker にコードは書かない。

記事はリポジトリの Markdown が正本だ。外部の CMS やデータベースを置かず、ビルド中に記事を外部 API から取らない。ビルド中に外部へ取りに行ってよいのは、リンクカードの OGP だけで、取れなくてもビルドを止めない。

React・Vue・Svelte などの UI フレームワークとアイランド（`client:*`）は使わない。クライアント JS は、目次の現在位置の強調と、コードブロックのコピーボタンだけだ。それ以上を足すなら ADR に理由を書く。動きのある部品は、先に HTML と CSS（`popover`・`<dialog>`・`<details>`・`@view-transition`）で作れないかを考える。

スタイルはコンポーネントの `<style>` に書き、色・余白・文字の大きさは `:root` の CSS 変数を使う。CSS フレームワークは入れない。日本語の Web フォントは読み込まない。

記事の URL は `/articles/<id>` で、末尾にスラッシュを付けない（`trailingSlash: 'never'`・`build.format: 'file'`）。公開済みの URL を変えたら、`_redirects` に 301 を書く。

コマンドは `vp` で実行する。新しいコマンドは `package.json` のスクリプトに書き、`AGENTS.md` と `CONTRIBUTING.md` に `vp run <名前>` の形で足す。

秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）はコードに書かず、コミットしない。`.env` だけに置く。
