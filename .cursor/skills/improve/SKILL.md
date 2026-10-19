---
name: improve
description: ブログ自体を改善するときに使う。「バックログから 1 件直して」「この指摘を直して再発しないようにして」と頼まれたとき、または会話で受けた指摘を直したあとに使う。1 件直し、再発防止を足し、改善ログに記録して PR にする。
---

# 改善を 1 件回す

[`docs/improvement-loop.md`](../../../docs/improvement-loop.md) の手順をエージェントが実行するためのスキル。

## 手順

1. **選ぶ**
   - 頼まれたものがあればそれ。無ければ `docs/improvement/backlog.md` と未解決の Issue（ラベル `improvement`）から選ぶ
   - 優先度: 記事や URL を失う・壊す > 設計のルールの破れ > 読者が受け取る品質 > 開発・執筆体験 > 見た目の好み
   - 1 PR 1 改善。大きいものは分割し、残りをバックログに戻す
2. **読む**
   - `rules/*.md`、関連する ADR（`docs/decisions/`）と指示書（`docs/specs/`）
   - `docs/improvement/log.md` で、同じ種類の改善が過去にないか確かめる（あれば仕組みが足りていない）
3. **直す**
   - 機能を足す・大きく変えるなら、先に `write-spec` スキルで指示書を書いて確認を取る
   - 値や方針を変えるなら `docs/decisions/` に ADR を足し、README の表にも足す
   - ライブラリの版や機能を前提にするときは、リリースのタグやドキュメントで今の版を確かめる
4. **再発を防ぐ（省略しない）**
   - frontmatter の誤り → Content Collections の Zod スキーマ
   - JSON-LD・メタタグ・URL → 組み立てる関数の隣の `*.test.ts`、ビルド出力の検査スクリプト
   - JS の増加・性能の低下 → 出力の検査で JS の量を制限、Lighthouse CI の閾値
   - 旧 URL・リンク切れ → 旧 URL の一覧と内部リンクの検査
   - 記事の書き方 → `rules/content.md` と `write-post` スキル
   - 判断基準 → `rules/*.md`・`AGENTS.md` か ADR
   - 手順 → `Makefile` のコマンドか `.cursor/skills/` のスキル
5. **確かめる**
   - `make check` が通ること
   - 見た目や構造化データを変えたら、PR のプレビュー URL で見る
6. **記録して出す**
   - `docs/improvement/log.md` の表の先頭に 1 行追記（日付・種別・内容・再発防止）。仕組みにできなければ再発防止は「—」とし、理由をバックログに残す
   - バックログの該当行を消す。途中で見つけた別の改善はバックログに足す
   - Conventional Commits でコミットし（`conventional-commits` スキル）、PR テンプレートのチェックリストを埋めて PR を作る

## やってはいけないこと

- 検査を通すために規則を緩める・外す。緩めるなら ADR に理由を書き、人の承認を得る
- `rules/*.md` に反する変更（サーバでの描画、UI フレームワーク、サードパーティのスクリプト、画面に無いことを書いた JSON-LD など）
- 複数の改善を 1 つの PR に混ぜる
- 古い ADR を消す（状態を「廃止（→ NNNN）」にして新しい ADR を足す）
