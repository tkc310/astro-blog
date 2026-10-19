# 設計判断の記録（ADR）

値や方針を決めた・変えたときは、ここに 1 判断 1 ファイルで残します。ファイル名は `NNNN-短い説明.md`（番号は連番）。
後から方針を変えるときは、古い ADR を消さずに状態を「廃止（→ NNNN）」にし、新しい ADR を足します。

| #                                             | 判断                                                                                  | 状態               |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ |
| [0001](./0001-astro-ssg.md)                   | フレームワークは Astro 7 の SSG にする（EmDash・Void は採らない）                     | 採用               |
| [0002](./0002-markdown-in-repo.md)            | 記事はリポジトリの Markdown を正本にし、MDX は使わない                                | 採用               |
| [0003](./0003-vite-plus.md)                   | コマンドとツールチェーンの入口を Vite+（`vp`）にまとめる                              | 一部廃止（→ 0014） |
| [0004](./0004-sveltia-cms.md)                 | 管理画面は Git-based の Sveltia CMS にする                                            | 採用               |
| [0005](./0005-cloudflare-workers-assets.md)   | Cloudflare Workers の静的アセットで配信し、プレビューは Workers Builds のブランチ URL | 一部廃止（→ 0017） |
| [0006](./0006-keep-legacy-urls.md)            | 旧ブログの URL（`/articles/<id>`、末尾スラッシュなし）を保つ                          | 採用               |
| [0007](./0007-no-ui-framework.md)             | UI フレームワークを入れず、Astro コンポーネントと scoped CSS で作る                   | 採用               |
| [0008](./0008-unified-markdown.md)            | Markdown の処理系を `unified()` にし、リンクカードと Expressive Code を使う           | 採用               |
| [0009](./0009-improvement-loop.md)            | AI 駆動開発の改善ループ（バックログ・ログ・ADR・指示書・スキル）を置く                | 採用               |
| [0010](./0010-microcms-migration.md)          | microCMS からの移行は一度きりのスクリプトで行い、画像もリポジトリに移す               | 採用               |
| [0011](./0011-rich-jsonld-graph.md)           | JSON-LD は `@graph` でページ内の情報をできるだけ多く結んで出す                        | 採用               |
| [0012](./0012-lapras-activities-on-client.md) | About の LAPRAS の活動一覧は、クライアントで取得して表示する                          | 廃止（→ 0017）     |
| [0013](./0013-retro-homepage-design.md)       | 見た目は平成初期の個人ホームページと掲示板のパロディにし、中身は今の技術で作る        | 廃止（→ 0016）     |
| [0014](./0014-makefile.md)                    | コマンドの入口を Makefile にまとめる（中身は vp と mise）                             | 採用               |
| [0015](./0015-theme-switch.md)                | 表示の切り替え（自動・昼・夜）を置く                                                  | 廃止（→ 0016）     |
| [0016](./0016-simple-white-design.md)         | 見た目は白地のシンプルなデザインにし、表示の切り替えは置かない                        | 採用               |
| [0017](./0017-top-on-demand-with-cache.md)    | `/about` だけを Worker で描き、Cloudflare にキャッシュする（LAPRAS の活動一覧）       | 採用               |
| [0018](./0018-migrate-from-public-pages.md)   | 移行のデータは microCMS の API ではなく、旧サイトの公開ページから取る                 | 採用               |

## テンプレート

```md
# NNNN タイトル

- 日付: YYYY-MM-DD
- 状態: 提案 / 採用 / 廃止（→ NNNN）

## 背景

## 決定

## 理由

## 影響・トレードオフ
```
