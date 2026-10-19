# AGENTS.md

開発者ブログ（microCMS + Next.js からのリプレイス）のリポジトリです。Astro の SSG で静的サイトを作り、Cloudflare Workers の静的アセットで配信します。どの AI エージェント（Claude Code・Cursor・Codex など）にも共通の作業ガイドです。

## いまの段階

**実装中。** `docs/specs/blog-replace.md` の「進め方」の順に、1 PR ずつ作っている。指示書に無い機能は、先に `docs/specs/` に指示書を書いて合意してから作る。

## 開発者用のコマンド

コマンドは Vite+ の `vp` で実行する（ADR-0003）。コマンドを足したら、`package.json` のスクリプトに書き、ここと `CONTRIBUTING.md` の両方に `vp` の形で書く。

- ツールを入れる: `mise install`（`.tool-versions` の node・pnpm・vp）
- 依存パッケージを入れる: `vp install`
- 開発サーバ起動: `vp run dev`（`astro dev`）。下書きも見るなら `SHOW_DRAFTS=true vp run dev`
- ビルド: `vp run build`（`astro build`）
- ビルド結果の検査: `vp run check-output`（`vp run build` の後）
- まとめて検査（フォーマット・静的・型）: `vp check`（直すなら `vp check --fix`）
- `.astro` の型検査: `vp run typecheck`（`astro check`）
- テスト: `vp test`
- 手元で Workers として確かめる: `vp run preview`
- CI と同じ順: `vp run typecheck` → `vp check` → `vp test` → `vp run build` → `vp run check-output`

npm のレジストリに届かない環境（一部のエージェントの作業環境）では、`docs/ai-agents.md` の「npm に届かない環境で作業するとき」に従う。

## まず読むもの

| やりたいこと                           | 読むもの                                                       |
| -------------------------------------- | -------------------------------------------------------------- |
| 全体の要件・技術スタックを知る         | `docs/specs/blog-replace.md`                                   |
| ブログ自体を直す・改善する             | `docs/improvement-loop.md` → `.claude/skills/improve/SKILL.md` |
| 判断の理由を知る                       | `docs/decisions/`（ADR）                                       |
| 機能を足す・大きく変える               | `docs/specs/`（先に指示書を書く。`write-spec` スキル）         |
| 記事を書く・移行する                   | `rules/content.md` → `.claude/skills/write-post/SKILL.md`      |
| 過去に直したこと・残っている改善を知る | `docs/improvement/log.md`・`docs/improvement/backlog.md`       |
| エージェントとの進め方を知る           | `docs/ai-agents.md`                                            |
| 開発の手順を知る                       | `CONTRIBUTING.md`                                              |

## 守ること

- `rules/` の規則に従う。`architecture.md`（SSG・クライアント JS・境界）、`content.md`（記事の形式）、`seo.md`（構造化データ・メタタグ・性能）。検査を通すために規則を緩めない（緩めるなら ADR に理由を書き、人の承認を得る）
- コミットメッセージは Conventional Commits（`type(scope): 説明`）で書く。書き方は `CONTRIBUTING.md` の「コミットメッセージ」と `.claude/skills/conventional-commits/SKILL.md`
- 1 PR 1 改善。直したら再発防止（検査・テスト・ルール・スキル）を足す
- 変更したら CI と同じ順の検査（上のコマンド）を通し、`docs/improvement/log.md` の表の先頭に 1 行記録する
- 値や方針を変えたら `docs/decisions/` に ADR を足す。古い ADR は消さず「廃止（→ NNNN）」にする
- 会話で受けた指摘も `log.md` に残し、同じ種類の指摘が続いたらルール文書か検査に格上げする
- 秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）をコミットしない
