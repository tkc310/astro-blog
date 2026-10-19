# 0017 トップだけを Worker で描き、Cloudflare にキャッシュする（LAPRAS の活動一覧）

- 日付: 2026-10-19
- 状態: 採用

## 背景

ADR-0012 で、LAPRAS の活動一覧をブラウザから公開 API（`https://lapras.com/public/<id>.json`）で取ることにした。ところが、サイトのページから `fetch` すると CORS で止まり、一覧が出ない（アドレスバーで開くと見られるが、ほかのオリジンからの `fetch` は許されていない）。

活動一覧は、トップ（自己紹介。`/about` はここへ 301）に置いている。ADR-0012 は、止まったときの代わりの手として「ビルド時に取得して毎日ビルドし直す」と「ブログの Worker で中継する」を挙げていた。

開発中は、LAPRAS の今の応答をすぐに見たい。本番は、開くたびに LAPRAS へ行かず、速く返したい。

## 決定

- トップ（`src/pages/index.astro`）だけを `export const prerender = false` にし、リクエストのときに Worker で描く。LAPRAS の API はサーバ（Worker）から呼ぶ。ほかのページは今までどおりビルド時に作る（`output: 'static'` のまま）
- Astro の Cloudflare アダプター（`@astrojs/cloudflare`）を入れる。ビルド時のページは Node.js で作る（`prerenderEnvironment: 'node'`）。画像はビルド時に変換し（`imageService: 'compile'`）、セッションは使わない（`session: false`）。KV と Images のバインディングは作らない
- 本番は Astro のルートキャッシュ（`Astro.cache`）と Cloudflare のキャッシュ（`cacheCloudflare()`、Workers Cache）で、ISR と同じ動きにする
  - 取れたとき: 1 時間は新しいものとして返し（`maxAge`）、その後 1 日は古いものを返しながら裏で描き直す（`swr`）
  - 取れなかったとき: 5 分だけキャッシュし、また取り直す
  - タグ `lapras` を付ける。デプロイしたらキャッシュは入れ替わる（最近の記事も新しくなる）
- 開発中（`make dev`）は `Astro.cache.enabled` が `false` なので、開くたびに描画する（SSR）。キャッシュの動きは `make preview`（`astro preview`、workerd）で確かめる
- LAPRAS の呼び出しは `src/lib/lapras.ts` にまとめる。3 秒で打ち切り、止まっていても、形が違っても投げずに、プロフィールへのリンクだけを出す。URL が `http(s)` でない項目は捨てる
- トップのクライアント JS（LAPRAS の取得）は消す。活動一覧は描いた HTML に入るので、取得前の高さの確保も要らない
- 下書きを出すかは、ビルドの時点で決めて `vite.define`（`__SHOW_DRAFTS__`）で入れる。Worker の中では `process.env` にビルドの環境変数が無いため
- 活動一覧は JSON-LD に入れない。LAPRAS の記録はこのサイトの著作物ではなく、キャッシュの間に変わるため

## 理由

- CORS は LAPRAS 側の設定なので、こちらからはサーバで取るしかない。中継の API を作るより、ページごと描く方が、HTML に一覧が入り、クライアント JS も CLS の心配も無くなる
- ルートキャッシュなら、キャッシュの期限・裏での描き直し・タグを Astro の API で書け、ヘッダー（`Cloudflare-CDN-Cache-Control`・`Cache-Tag`）はプロバイダが付ける
- 毎日ビルドし直す案は、GitHub Actions の定期実行とデプロイの手間が増え、開発中に今の応答を見られない
- 描き直すのはトップだけで、記事は静的なままなので、速さと SEO への影響は小さい

## 影響・トレードオフ

- ブログの Worker にコード（Astro のアダプターの入口）が入る。ADR-0005 の「アダプターは使わない」「Worker のコードを持たない」と、ADR-0001 の「すべてのページをビルド時に作る」は、トップについてだけこの ADR に置き換える。ADR-0012 は廃止する
- `make dev` と `make preview` は workerd で動く（アダプターが Cloudflare の Vite プラグインを使うため）
- ビルド結果は `dist/client`（静的アセット）と `dist/server`（Worker と、生成した `wrangler.json`）に分かれる。`wrangler deploy` は生成した設定を読む。`scripts/check-output.mjs` が、`index.html` が無いこと（あると Worker に届かない）、Workers Cache が有効なこと、KV と Images のバインディングが無いことを確かめる
- ルートキャッシュと `cacheCloudflare()` は実験的な機能（Astro 7）なので、Astro とアダプターを上げるときは変更履歴を見る
- トップの初回（キャッシュの無いとき）は LAPRAS を待つぶん遅い。打ち切りは 3 秒
- 依存を足したため、ロックファイルを CI で作り直す仕組み（Lockfile ワークフロー）を置いた（`docs/ai-agents.md`）
