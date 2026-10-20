# SEO と性能の規則

すべてのページは、共通のレイアウトから `<title>`、meta description、canonical、OGP、Twitter Card を出す。canonical は末尾スラッシュなしの絶対 URL だ。OGP 画像は、サイト共通の既定の画像を使う。

## 構造化データ（JSON-LD）

できるだけリッチに出す（ADR-0011）。ただし**画面に無いことは書かない**。値は frontmatter・本文・サイト設定（`src/site.config.ts`）から作る。

1 ページに `<script type="application/ld+json">` を 1 つだけ出し、中身は `@graph` にする。型は `schema-dts` で付け、組み立ては `src/lib/jsonld/` にまとめる。日付は ISO 8601 でタイムゾーンを付け、URL は絶対 URL にする。

サイト全体で共通のノードには固定の `@id` を付け、ほかのノードからは `{"@id": …}` で参照する。

| `@id`             | 型        | 項目                                                                                                                                                                                      |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<site>/#website` | `WebSite` | `name`・`alternateName`・`url`・`description`・`inLanguage`・`publisher`（→ Person）                                                                                                      |
| `<site>/#blog`    | `Blog`    | `name`・`url`・`description`・`inLanguage`・`author`・`publisher`（→ Person）・`isPartOf`（→ WebSite）                                                                                    |
| `<site>/#person`  | `Person`  | `name`・`alternateName`（ハンドル名）・`url`（`/about`）・`image`（`/profile.png`、512px）・`description`（自己紹介）・`sameAs`（GitHub・X・Zenn・Qiita・LAPRAS。画面のリンクと同じもの） |

ページごとに出すノード:

| ページ                 | ノード                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| 記事詳細               | `WebPage`・`BlogPosting`・`BreadcrumbList`（ホーム › カテゴリ › 記事）・共通の 3 ノード              |
| 記事一覧               | `CollectionPage`・`ItemList`（ページ内の記事を `ListItem` で、`position` と `url`）・共通の 3 ノード |
| カテゴリ               | `CollectionPage`・`ItemList`・`BreadcrumbList`（ホーム › カテゴリ）・共通の 3 ノード                 |
| 私について（`/about`） | `ProfilePage`（`mainEntity` → Person）・共通の 3 ノード                                              |
| 404                    | 出さない                                                                                             |

記事詳細の `BlogPosting`（`@id` は `<記事の URL>#article`）には、次をすべて入れる。

- `headline`（110 字以内）・`description`・`url`・`mainEntityOfPage`（→ WebPage）・`isPartOf`（→ Blog）
- `datePublished`・`dateModified`（`updatedDate`、無ければ `pubDate`）
- `author`・`publisher`・`copyrightHolder`（→ Person）・`copyrightYear`
- `image`（`ImageObject`。`url`・`width`・`height`。既定の OGP 画像）・`thumbnailUrl`
- `articleSection`・`keywords`（どちらもカテゴリ名）
- `inLanguage`（`ja`）・`isAccessibleForFree`（`true`）・`wordCount`（本文の文字数）
- `hasPart`: 本文のコードブロックごとに `SoftwareSourceCode`（`programmingLanguage`、ファイル名があれば `name`）
- `citation`: 本文のリンクカードと外部リンクごとに `CreativeWork`（`url`、取れたら `name`）

`WebPage`（`@id` は `<記事の URL>#webpage`）には `url`・`name`・`isPartOf`（→ WebSite）・`breadcrumb`（→ BreadcrumbList）・`primaryImageOfPage`・`datePublished`・`dateModified`・`inLanguage` を入れる。

使わないもの: 画面に無い評価（`AggregateRating`）、FAQ や手順になっていない記事の `FAQPage`・`HowTo`、サイト内検索が無いあいだの `SearchAction`。読了時間とライセンスは画面に出さないので、`timeRequired`・`license` も出さない。About は自己 PR だけで肩書や得意分野の欄を持たないので、`Person` の `jobTitle`・`knowsAbout` も出さない。私についての LAPRAS の活動一覧は、このサイトの著作物ではなく、キャッシュの間に変わるので、JSON-LD に入れない（ADR-0017）。

下書き、`/admin/`、404 は `noindex` にし、サイトマップと RSS に入れない。

## 性能

画像は `astro:assets` で出し、`width`・`height` を必ず付ける。ファーストビューの外の画像は `loading="lazy"` にする。レイアウトをずらすもの（読み込み後に高さが変わる要素、遅れて差し込まれるリンクカードや広告）を置かない。

サードパーティのスクリプト（タグマネージャー、広告、埋め込みウィジェット）は入れない。計測は Cloudflare Web Analytics だけだ。

目標は Core Web Vitals の 75 パーセンタイルで LCP < 2.5s、CLS < 0.1、INP < 200ms、Lighthouse（モバイル）で性能・アクセシビリティ・ベストプラクティス・SEO がすべて 100 点だ（ADR-0021）。CI は、アクセシビリティ・ベストプラクティス・SEO が 100 点、性能が 98 点（測るたびの揺れの分）、CLS が 0.01 以下、LCP が 2.5 秒以下でないと落ちる。これを下回る変更は、理由を ADR に書く。

読み込んだあとで高さが変わる部品（開いて出して閉じる `<details>` など）を、本文の流れの中に置かない。閉じた状態で出し、開くなら本文の外（絶対配置）にする。
