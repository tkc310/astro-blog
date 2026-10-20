---
title: ブログをNext.jsからAstroにリプレイス
description: |-
  microCMS + Next.js + Vercel で作っていたこのブログを、Astro + Sveltia CMS + Cloudflare Workers に作り直しました。

  この記事では、新しい構成の導入手順と、旧ブログの記事を Claude（Claude Code）にスクレイピングさせて Markdown に移した方法をまとめます。
pubDate: 2026-10-20T12:00:00
updatedDate: 2026-10-20T12:00:00
category: tech
draft: false
---

microCMS + Next.js + Vercel で作っていたこのブログを、Astro + Sveltia CMS + Cloudflare Workers に作り直しました。

この記事では、新しい構成の導入手順と、旧ブログの記事を Claude（Claude Code）にスクレイピングさせて Markdown に移した方法をまとめます。

## なぜ作り直したか

旧ブログは 2021 年に作ったもので、次のような構成でした。

- フレームワーク: Next.js 12（SSG）
- UI: Chakra UI
- CMS: microCMS（本文は MDX のテキスト）
- ホスティング: Vercel

数年放っておいたあいだに Next.js も Chakra UI も大きく変わり、手を入れるには依存の更新から始める必要がありました。作り直すにあたって決めた目的は 3 つです。

- **表示を速くする**: 記事を読むだけのページに、クライアントの JavaScript はほとんど要らない
- **構造化データ（JSON-LD）を充実させる**: 検索エンジンと AI の要約に、記事の中身を正しく伝える
- **新しい道具に触る**: Cloudflare Workers・Astro・Vite+ のキャッチアップ

## 構成

| 役割           | 使ったもの                                          |
| -------------- | --------------------------------------------------- |
| フレームワーク | Astro 7（SSG。1 ページだけ Worker で描画）          |
| 記事           | リポジトリの Markdown（MDX は使わない）             |
| 管理画面       | Sveltia CMS（Git-based）                            |
| 配信           | Cloudflare Workers の静的アセット ＋ Workers Builds |
| CMS の認証     | sveltia-cms-auth（別の Cloudflare Worker）          |
| ツールチェーン | Vite+（検査・テスト・フォーマット）、pnpm、mise     |

記事の正本は GitHub のリポジトリの Markdown です。管理画面で書いた記事も、GitHub にコミットされるだけなので、データベースも外部の CMS もありません。

https://github.com/tkc310/astro-blog

## 導入手順

### 1. Astro を静的サイトとして作る

旧ブログの記事の URL（`/articles/<id>`、末尾スラッシュなし）をそのまま保ちたかったので、Astro の出力を次のようにしました。

```plain
export default defineConfig({
  site: "https://tkc310.com",
  output: "static",
  trailingSlash: "never",
  build: {
    // /articles/<id>.html を出し、Workers の静的アセットが /articles/<id> を 200 で返す
    format: "file",
  },
});
```

`build.format: "file"` にすると、`/articles/foo/index.html` ではなく `/articles/foo.html` が出ます。Cloudflare Workers の静的アセットは、`/articles/foo` へのリクエストに `foo.html` をリダイレクトなしで返してくれます。

記事はコンテンツコレクションで読み、frontmatter を Zod のスキーマで検査します。項目が足りない・余計な項目がある記事は、ビルドで止まります。

```plain
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z
    .object({
      title: z.string().min(1).max(110),
      description: z.string().min(1).max(200),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: reference("categories"),
      draft: z.boolean().default(false),
    })
    .strict(),
});
```

Markdown の処理は `unified()` にして、リンクカード（remark-link-card-plus）・コードブロックの装飾（Expressive Code）・外部リンクを別タブで開く設定（rehype-external-links）を入れています。リンクカードの OGP はビルド時に取るので、読み込んだあとでレイアウトがずれることはありません。

### 2. Cloudflare Workers にデプロイする

Cloudflare のダッシュボードで Worker を作り、GitHub のリポジトリとつなぎます（Workers Builds）。

<!-- スクショ 1: Workers Builds でリポジトリをつなぐ画面（ビルドコマンド・デプロイコマンド・プレビュービルドの設定） -->

| 項目             | 値                                  |
| ---------------- | ----------------------------------- |
| ビルドコマンド   | `pnpm run build`                    |
| デプロイコマンド | `npx wrangler deploy`（既定のまま） |
| プレビュービルド | 有効                                |

プレビュービルドを有効にすると、`main` 以外のブランチを push するたびに、ブランチごとのプレビュー URL にデプロイされます。下書きの記事はプレビュー URL にだけ出し、本番には出しません。Workers Builds がビルド中に入れる `WORKERS_CI_BRANCH` を見て切り替えています。

プレビュー URL はそのままだと誰でも開けるので、あとで Cloudflare Access で認証をかけました（手順 7）。

```plain
export function shouldShowDrafts(env: Record<string, string | undefined>): boolean {
  if (env.SHOW_DRAFTS === "true") return true;
  if (env.SHOW_DRAFTS === "false") return false;
  const branch = env.WORKERS_CI_BRANCH;
  return branch !== undefined && branch !== "" && branch !== "main";
}
```

`wrangler.jsonc` に書くのは名前と静的アセットの扱いくらいです。Worker の入口とアセットの置き場所は、Astro の Cloudflare アダプターがビルドのときに足してくれます。

```plain
{
  "name": "astro-blog",
  "compatibility_date": "2026-10-19",
  "assets": {
    "html_handling": "auto-trailing-slash",
  },
  "observability": { "enabled": true },
}
```

旧ブログの URL のうち、無くしたページ（タグ・ノート・寄付など）は `public/_redirects` で 301 にしました。旧サイトのサイトマップにあった URL を一覧にしておき、すべてが 200 か 301 を返すことを CI で確かめています。

### 3. 1 ページだけ Worker で描画してキャッシュする

ほぼ静的サイトですが、私について（`/about`）だけは例外です。LAPRAS の公開 API から最近の活動を取って載せたかったのに、ブラウザから `fetch` すると CORS で止まってしまいました。

そこで `/about` だけを `prerender = false` にしてサーバ（Worker）から API を呼び、Astro のルートキャッシュで Cloudflare にキャッシュしています。Vercel の ISR と同じ動き（期限が切れたら、古いものを返しながら裏で描き直す）です。

```plain
---
export const prerender = false;

const activities = await fetchActivities("tkc310", { limit: 10 });

// 開発中は cache.enabled が false なので、毎回描画される
if (Astro.cache.enabled) {
  Astro.cache.set(
    activities.ok
      ? { maxAge: 60 * 60, swr: 60 * 60 * 24, tags: ["lapras"] }
      : { maxAge: 60 * 5, tags: ["lapras"] },
  );
}
---
```

```plain
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";

export default defineConfig({
  output: "static",
  adapter: cloudflare({ prerenderEnvironment: "node", imageService: "compile" }),
  session: false, // セッションを使わないので KV を作らない
  cache: { provider: cacheCloudflare() },
});
```

LAPRAS の API は 3 秒で打ち切り、取れなくてもプロフィールへのリンクを出してページを返すようにしています。

### 4. Sveltia CMS を置く

Sveltia CMS は、Decap CMS（旧 Netlify CMS）の後継として作り直された Git-based の CMS です。`public/admin/` に HTML と設定ファイルを置くだけで、`/admin/` が管理画面になります。

https://github.com/sveltia/sveltia-cms

```plain
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>管理画面 | tkc310.com</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms@0.228.0/dist/sveltia-cms.js"></script>
  </body>
</html>
```

設定では、保存の方式を Editorial Workflow にしています。管理画面で保存すると、記事ごとのブランチとプルリクエストができます。プレビュー URL で見た目を確かめてからマージすると公開される流れです。

```plain
backend:
  name: github
  repo: tkc310/astro-blog
  branch: main
  base_url: https://astro-blog-sveltia-cms-auth.tkc310.workers.dev
publish_mode: editorial_workflow
site_url: https://tkc310.com

collections:
  - name: posts
    label: 記事
    folder: src/content/posts
    extension: md
    format: yaml-frontmatter
    create: true
    media_folder: /src/assets/posts/{{filename}}
    public_folder: ../../assets/posts/{{filename}}
    fields:
      - { name: title, label: タイトル, widget: string }
      - { name: description, label: 説明, widget: text }
      - { name: pubDate, label: 公開日, widget: datetime }
      - { name: category, label: カテゴリ, widget: relation, collection: categories, value_field: "{{slug}}", display_fields: [name] }
      - { name: draft, label: 下書き, widget: boolean, required: false }
      - { name: body, label: 本文, widget: markdown }
```

frontmatter の項目は、Astro の Zod スキーマと Sveltia の設定の 2 か所に書くことになります。ずれるとビルドで止まるので、両方がそろっているかをテストで確かめています。

<!-- スクショ 2: Sveltia CMS の記事の一覧 --> <!-- スクショ 3: Sveltia CMS の記事の編集画面（左に入力欄、右にプレビュー） -->

### 5. GitHub の OAuth App と認証の Worker を作る

Sveltia CMS で GitHub にログインするには、OAuth のやり取りを中継するサーバが要ります。公式の sveltia-cms-auth を、ブログとは別の Cloudflare Worker として動かしました。

https://github.com/sveltia/sveltia-cms-auth

1. **認証の Worker をデプロイする**: README の「Deploy to Cloudflare Workers」ボタンから作ります。ビルドコマンドは空欄、プレビュービルドと Cloudflare Access は不要です。できた Worker の URL（`https://<名前>.<サブドメイン>.workers.dev`）を控えます
2. **GitHub の OAuth App を作る**: GitHub の Settings → Developer settings → OAuth Apps から作ります
   - Redirect URIs: `<Worker の URL>/callback`
   - Allow wildcard matching: オフ（Worker が `redirect_uri` を毎回はっきり送るので不要）
   - Enable Device Flow: オフ
3. **Worker に値を入れる**: Worker の Settings → Variables and Secrets に、`GITHUB_CLIENT_ID`・`GITHUB_CLIENT_SECRET`（シークレットとして）・`ALLOWED_DOMAINS`（`tkc310.com`）を入れます
4. **CMS の設定に Worker の URL を書く**: `config.yml` の `backend.base_url` に書きます

<!-- スクショ 4: GitHub の OAuth App の登録画面（Redirect URIs と Allow wildcard matching） --> <!-- スクショ 5: 認証の Worker の Variables and Secrets（値は隠す） -->

2026 年 8 月から、GitHub の OAuth App では「Authorization callback URL」が「Redirect URIs」になり、複数の URL を登録できるようになりました。「Allow wildcard matching」は、以前は URL が 1 つのアプリで暗黙にオンだったものが見えるようになっただけなので、要らなければオフにしておくのがよさそうです。

### 6. DNS を Cloudflare に切り替える

ドメインはお名前.com で取っていて、ネームサーバーは Vercel を向いていました。切り替えは次の順で行いました。

1. Cloudflare にドメインを足し、Vercel の DNS から読み込んだレコードを整理する（このときは Vercel を向いた A レコードをプロキシなしで残す）
2. お名前.com のネームサーバーを Cloudflare のものに変える（この間も旧サイトが見える）
3. ゾーンが有効になったら、A レコードを消し、Worker のカスタムドメインに `tkc310.com` を足す
4. `www` は Redirect Rule で `tkc310.com` へ 301 にする
5. 旧ブログの URL の一覧がすべて 200 か 301 を返すことを確かめる

<!-- スクショ 6: Worker の「ドメインとルート」でカスタムドメインを足した画面 -->

### 7. プレビュー URL を Cloudflare Access で守る

プレビュー URL（`<ブランチ名>-astro-blog.<サブドメイン>.workers.dev`）には下書きの記事も出るので、そのままだと公開前の記事を誰でも読めてしまいます。Cloudflare Access で、プレビュー URL にだけ認証をかけました。

1. Workers & Pages で Worker を開き、**Access** タブの **Protect this Worker behind Access** を選ぶ
2. 範囲は **Previews only** にする
3. 認証のポリシーを選ぶ（1 人で使うなら、Cloudflare のアカウントのメンバーだけを通すのが簡単）
4. **Apply Access** を押す

<!-- スクショ 8: Worker の Access タブ（Previews only と認証のポリシー） -->

範囲を **All traffic** にすると、Worker につながるすべてのドメインが対象になり、カスタムドメインの本番（`tkc310.com`）まで認証が必要になります。プレビューだけを守りたいときは Previews only を選びます。

これでプレビュー URL を開くと、Cloudflare のログイン画面が出るようになりました。気をつけたのは次の 3 点です。

- **ブランチの URL は 1 つのラベル**: プレビュー URL は `cms-posts-foo-astro-blog.<サブドメイン>.workers.dev` のように、ブランチ名と Worker の名前が 1 つのラベルにつながります。Zero Trust 側で自分でアプリを作り、`*.astro-blog.<サブドメイン>.workers.dev` のようなホスト名を指定しても当たりません。Worker の Access タブから設定するのが確実です
- **ポリシーの動作は Allow**: Bypass にすると、誰でも認証なしで通ります
- **CMS の認証の Worker には掛けない**: 管理画面のログイン（GitHub）の途中で Access の画面が挟まると、ログインできなくなります

CI の Lighthouse とスクリーンショットは、CI の中で `astro preview` を起動して `localhost` に対して動かしているので、Access の影響を受けません。

## 移行: Claude に旧サイトをスクレイピングさせて Markdown を作る

記事の移行は、Claude Code に任せました。はじめは microCMS の API から記事を取る予定でしたが、API キーをエージェントの作業環境に渡したくなかったので、公開しているサイトから取る方法に変えています。

### 公開ページの `__NEXT_DATA__` を読む

旧サイトは Next.js の SSG（`getStaticProps`）で作っていたので、各ページの HTML に `__NEXT_DATA__` として、microCMS の API の応答がそのまま埋め込まれています。HTML から本文を逆算しなくても、記事の本文（MDX のテキスト）・カテゴリ・日付・抜粋がそのまま取れます。

これに気づいたのは Claude でした。旧ブログのリポジトリと公開ページを読ませたところ、API を使わない方法としてこれを提案してきました。

```plain
async function nextData(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${LEGACY_SITE}${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const html = await response.text();
  const json = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(
    html,
  )?.[1];
  if (!json) throw new Error(`${path}: __NEXT_DATA__ がありません`);
  return (JSON.parse(json) as { props: { pageProps: Record<string, unknown> } }).props.pageProps;
}
```

記事の ID は、トップと `/articles/page/<n>` の一覧を順にたどって集めます。サイトマップには 16 本中 10 本しか載っていなかったので使えませんでした。

### 本文を変換する

旧ブログは、描画の前に本文を書き換えていました。新しいブログで同じ見た目になるよう、移行のときに Markdown を直します。変換のルールは先に指示書に書き、Claude にスクリプトとテストを書かせました。

| 旧ブログでの書き方                                          | 移行後                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `<https://...>` だけの行（実行時に OGP を取るリンクカード） | URL だけの行（ビルド時にリンクカードになる）           |
| microCMS の画像の URL                                       | 画像をダウンロードしてリポジトリに置き、相対パスに直す |
| `<img src="..." alt="..." />`                               | `![alt](...)` に直す                                   |
| 本文中の `#`（h1）                                          | 全体を 1 段下げる（ページの h1 はタイトルだけ）        |
| 言語名の無いコードブロック                                  | `text` を付けて一覧に出す                              |
| JSX のコンポーネント                                        | 自動では直さず、一覧に出して下書きにする               |

スクリプトは何度実行しても同じ結果になるようにしてあります。出力先を消してから書き、最後に整形までするので、旧サイトに新しい記事が無ければ差分は出ません。切り替えの直前にもう一度実行して、取りこぼしが無いことを確かめました。

### 結果

記事 15 本・カテゴリ 5 個・画像 12 枚を移せました。手で直す必要があったのは、JSX のコンポーネントが残ったテスト用の記事 1 本だけで、これは移さないことにしました。

AI に任せてよかったのは、移行のような「一度きりだが、正確さが要る」作業を、指示書とテスト付きのスクリプトにして残してくれたことです。手作業でコピーしていたら、画像の取りこぼしや見出しのレベルのずれに気づけなかったと思います。

一方で、旧サイトの作り（`__NEXT_DATA__`）に頼る方法なので、旧サイトを消したら再実行できません。移行が終わるまで、旧サイトは残しておく必要があります。

## ハマったところ

### Workers Builds が `.tool-versions` を asdf で読もうとする

ツールの版を `.tool-versions` に書いていたところ、Workers Builds がこれを asdf で読もうとし、`pnpm` の行を入れられずにビルドが止まりました。mise には `mise.toml`、GitHub Actions と Workers Builds には `.node-version` で版を渡すようにして解決しました。

### ビルドのキャッシュでリンクカードの画像が落ちる

本番でリンクカードの画像だけが 404 になりました。Workers Builds が Astro のキャッシュを戻してビルドするため、描画済みの本文が使い回され、画像をダウンロードする処理が走っていなかったのが原因です。ビルドを `astro build --force` にして、キャッシュを捨てて回すようにしました。

### 応答しないサイトの OGP を 5 分待つ

CI のビルドが 1 分から 6 分に延びました。リンクカードのプラグインが、OGP を取るライブラリに秒で渡すべきタイムアウトをミリ秒で渡していて、応答しないサイトを Node の既定の 5 分まで待っていました。pnpm の patch で 10 秒に直しています。

## 結果

本番の Lighthouse（モバイル）は、測った 5 ページとも、性能・アクセシビリティ・ベストプラクティス・SEO の 4 項目が 100 点になりました。CI でも Lighthouse を回していて、点が下がる変更はマージできないようにしています。

<!-- スクショ 7: Lighthouse の結果（4 項目 100 点） -->

## おわりに

作り直しのほとんどは、Claude Code と会話しながら進めました。技術の選定・要件・設計の判断を先に文書（指示書と ADR）にしてから実装させ、直した内容と再発防止をログに残す流れにしたので、あとから「なぜこうなっているのか」をたどれます。

この記事も、その管理画面から投稿しています。

<br />

![Sveltia CMSの管理画面](../../assets/posts/next-to-astro/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-10-20%2012.04.37.png)
