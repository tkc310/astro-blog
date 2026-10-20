# コマンドの入口（ADR-0014）。中身は pnpm・vp（Vite+）・mise を呼ぶだけ。
# package.json のスクリプトは pnpm run で、Vite+ の組み込みのコマンド（check・test・fmt）は
# プロジェクトに入れた vite-plus を pnpm exec vp で呼ぶ。グローバルの vp には頼らない。
# 一覧は `make` か `make help`。追加の引数は ARGS で渡す（例: make test ARGS="src/lib"）。
# コマンドを足すときは、ここに `## 説明` 付きで足し、AGENTS.md と CONTRIBUTING.md に make の形で書く。

ARGS ?=
VP := pnpm exec vp

.DEFAULT_GOAL := help
.PHONY: help setup install dev build preview deploy check typecheck lint fmt fmt-fix test check-output migrate outdated update clean

help: ## コマンドの一覧を出す
	@awk 'BEGIN { FS = ":.*## " } /^[a-zA-Z_-]+:.*## / { printf "  make %-14s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## ツール（Node.js・pnpm を mise か asdf で）と依存パッケージを入れる
	scripts/setup.sh

install: ## 依存パッケージを入れる
	pnpm install $(ARGS)

dev: ## 開発サーバを workerd で起動する。/about は毎回描画する（下書きも見るなら SHOW_DRAFTS=true make dev）
	pnpm run dev $(ARGS)

build: ## 本番と同じビルドをする（dist/）
	pnpm run build $(ARGS)

preview: ## ビルドして、手元で Workers として動かす（/about のキャッシュもここで確かめる）
	pnpm run preview $(ARGS)

deploy: ## ビルドして Cloudflare に手動でデプロイする（ふだんは Workers Builds が行う）
	pnpm run deploy $(ARGS)

# 順番に意味があるので（型の生成 → 検査、ビルド → 出力の検査）、前提ではなく 1 つずつ呼ぶ。
# 入れ子の make に ARGS が引き継がれないよう、ARGS= で空にする。
check: ## CI と同じ検査をすべて回す（typecheck → lint → test → build → check-output）
	$(MAKE) typecheck ARGS=
	$(MAKE) lint ARGS=
	$(MAKE) test ARGS=
	$(MAKE) build ARGS=
	$(MAKE) check-output ARGS=

typecheck: ## .astro を含めて型を検査する（astro check。型の生成もする）
	pnpm run typecheck $(ARGS)

lint: ## フォーマット・静的検査・型検査をまとめて回す（vp check）
	$(VP) check $(ARGS)

fmt: ## フォーマットのずれだけを検査する
	$(VP) fmt --check $(ARGS)

fmt-fix: ## フォーマットと、自動で直せる静的検査の指摘を直す
	$(VP) check --fix $(ARGS)

test: ## テストを回す（Vitest）
	$(VP) test $(ARGS)

check-output: ## ビルド結果（dist/）を検査する（make build の後）
	pnpm run check-output $(ARGS)

migrate: ## 旧ブログ（tkc310.com）の記事を Markdown に移す（docs/specs/microcms-migration.md。何度実行しても同じ結果）
	pnpm run migrate $(ARGS)

outdated: ## 新しい版がある依存パッケージを一覧する
	pnpm outdated $(ARGS)

update: ## 依存パッケージを、package.json の範囲で新しくする
	pnpm update $(ARGS)

clean: ## ビルド結果と生成物を消す
	rm -rf dist .astro .wrangler
