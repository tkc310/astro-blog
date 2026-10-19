# AGENTS.md

開発者ブログ（microCMS + Next.js からのリプレイス）のリポジトリです。Astro の SSG で静的サイトを作り、Cloudflare Workers の静的アセットで配信します。どの AI エージェント（Claude Code・Cursor・Codex など）にも共通の作業ガイドです。

## いまの段階

**計画段階。アプリのコードはまだ無い。** 先に `docs/specs/` の指示書と `docs/decisions/` の ADR で合意してから実装に入る。頼まれていないのにコード（`package.json`・`src/` など）を足さない。

## 開発者用のコマンド

コマンドは Vite+ の `vp` で実行する（ADR-0003）。下は雛形を作ったあとに使えるようになる予定の一覧。コマンドを足したら、ここと `CONTRIBUTING.md` の両方に `vp` の形で書く。

- 依存パッケージを入れる: `vp install`
- 開発サーバ起動: `vp run dev`（`astro dev`）
- ビルド: `vp run build`（`astro build`）
- まとめて検査（フォーマット・静的・型）: `vp check`（直すなら `vp check --fix`）
- `.astro` の型検査: `vp run typecheck`（`astro check`）
- テスト: `vp test`
- コミットメッセージの検査: `vp run lint-commits`

## まず読むもの

| やりたいこと                           | 読むもの                                                    |
| -------------------------------------- | ----------------------------------------------------------- |
| 全体の要件・技術スタックを知る         | `docs/specs/blog-replace.md`                                |
| ブログ自体を直す・改善する             | `docs/improvement-loop.md` → `.claude/skills/improve/SKILL.md` |
| 判断の理由を知る                       | `docs/decisions/`（ADR）                                    |
| 機能を足す・大きく変える               | `docs/specs/`（先に指示書を書く。`write-spec` スキル）      |
| 記事を書く・移行する                   | `rules/content.md` → `.claude/skills/write-post/SKILL.md`   |
| 過去に直したこと・残っている改善を知る | `docs/improvement/log.md`・`docs/improvement/backlog.md`    |
| エージェントとの進め方を知る           | `docs/ai-agents.md`                                         |
| 開発の手順を知る                       | `CONTRIBUTING.md`                                           |

## 守ること

- `rules/` の規則に従う。`architecture.md`（SSG・クライアント JS・境界）、`content.md`（記事の形式）、`seo.md`（構造化データ・メタタグ・性能）。検査を通すために規則を緩めない（緩めるなら ADR に理由を書き、人の承認を得る）
- コミットメッセージは Conventional Commits（`type(scope): 説明`）で書く。書き方は `CONTRIBUTING.md` の「コミットメッセージ」と `.claude/skills/conventional-commits/SKILL.md`
- 1 PR 1 改善。直したら再発防止（検査・テスト・ルール・スキル）を足す
- 変更したら `vp check` と `vp test` を通し（雛形ができてから）、`docs/improvement/log.md` の表の先頭に 1 行記録する
- 値や方針を変えたら `docs/decisions/` に ADR を足す。古い ADR は消さず「廃止（→ NNNN）」にする
- 会話で受けた指摘も `log.md` に残し、同じ種類の指摘が続いたらルール文書か検査に格上げする
- 秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）をコミットしない
