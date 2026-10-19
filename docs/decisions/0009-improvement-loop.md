# 0009 AI 駆動開発の改善ループ（バックログ・ログ・ADR・指示書・スキル）を置く

- 日付: 2026-10-19
- 状態: 採用

## 背景

開発の多くと記事の一部を AI エージェントと進める。会話で受けた指摘がその場で直るだけだと、別の会話で同じ失敗を繰り返し、判断の理由も残らない。

## 決定

[tkc310/yorozuya](https://github.com/tkc310/yorozuya/tree/main/docs) の仕組みに倣い、次を置く。

- `AGENTS.md`（どのエージェントにも共通の入口）と、それを読み込むだけの `CLAUDE.md`
- `rules/`：設計のルール（`architecture.md`・`content.md`・`seo.md`）。Cursor 向けには `.cursor/rules/*.mdc` から指す
- `docs/improvement-loop.md`：気づく → 記録する → 直す → 再発を防ぐ → 振り返る の手順と、問題の種類ごとに足す再発防止の対応表
- `docs/improvement/backlog.md`・`log.md`：改善候補と、直したことの 1 改善 1 行の記録
- `docs/decisions/`：ADR。`docs/specs/`：実装前に書く指示書
- `.cursor/skills/`：スキルの正本（`improve`・`write-spec`・`write-post`・`conventional-commits`）。`.claude/skills` はここへのシンボリックリンク
- Issue テンプレート「改善提案」と、PR テンプレートのチェックリスト

## 理由

- 指摘を検査・テスト・ルールに変えれば、どのエージェント・どの会話でも同じ失敗を防げる
- ADR とログがあれば、後から来た人やエージェントが「なぜこうなっているか」を追える
- 計画段階から置いておけば、最初の実装からループに乗せられる

## 影響・トレードオフ

- PR ごとに log.md を 1 行書く手間が増える
- ログとバックログは手で保守するので、古くなったらまとめて整理する
- 検査の多くは雛形ができてから入る。それまでは規則を文書とレビューで守る
