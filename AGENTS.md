# AGENTS.md

開発者ブログ（microCMS + Next.js からのリプレイス）のリポジトリです。Astro の SSG で静的サイトを作り、Cloudflare Workers の静的アセットで配信します。どの AI エージェント（Claude Code・Cursor・Codex など）にも共通の作業ガイドです。

## いまの段階

**実装中。** `docs/specs/blog-replace.md` の「進め方」の順に、1 PR ずつ作っている。指示書に無い機能は、先に `docs/specs/` に指示書を書いて合意してから作る。

## 開発者用のコマンド

コマンドは `make` で実行する（`Makefile`、ADR-0014）。一覧は `make help`。追加の引数は `ARGS="..."` で渡す。コマンドを足すときは `Makefile` に `## 説明` 付きで足し、ここと `CONTRIBUTING.md` に `make` の形で書く（`scripts/makefile.test.ts` が検査する）。中身は `vp`（Vite+）と `mise` を呼ぶだけ。

- ツールと依存パッケージを入れる: `make setup`（`.tool-versions` の node・pnpm・vp を mise で入れ、依存を入れる）
- 依存パッケージだけを入れる: `make install`
- 開発サーバ起動: `make dev`。下書きも見るなら `SHOW_DRAFTS=true make dev`
- ビルド: `make build`
- ビルド結果の検査: `make check-output`（`make build` の後）
- CI と同じ検査をすべて: `make check`（typecheck → lint → test → build → check-output）
- `.astro` を含めた型検査: `make typecheck`（`astro check`）
- フォーマット・静的検査・型検査: `make lint`（`vp check`）
- フォーマットだけを検査: `make fmt`（直すなら `make fmt-fix`）
- テスト: `make test`（例: `make test ARGS="src/lib"`）
- 手元で Workers として確かめる: `make preview`
- 手動でデプロイ: `make deploy`（ふだんは Workers Builds が行う）
- 新しい版がある依存パッケージを一覧: `make outdated`（範囲内で上げるなら `make update`）
- ビルド結果と生成物を消す: `make clean`
- コマンドの一覧: `make help`

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
- 変更したら `make check` を通し、`docs/improvement/log.md` の表の先頭に 1 行記録する
- 値や方針を変えたら `docs/decisions/` に ADR を足す。古い ADR は消さず「廃止（→ NNNN）」にする
- 会話で受けた指摘も `log.md` に残し、同じ種類の指摘が続いたらルール文書か検査に格上げする
- 秘密情報（microCMS の API キー、OAuth のクライアントシークレット、Cloudflare のトークン）をコミットしない
