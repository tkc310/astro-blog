# コマンドの入口（ADR-0014）。中身は vp（Vite+）と mise を呼ぶだけ。
# 一覧は `make` か `make help`。追加の引数は ARGS で渡す（例: make test ARGS="src/lib"）。
# コマンドを足すときは、ここに `## 説明` 付きで足し、AGENTS.md と CONTRIBUTING.md に make の形で書く。

ARGS ?=

.DEFAULT_GOAL := help
.PHONY: help setup install dev build preview deploy check typecheck lint fmt fmt-fix test check-output outdated update clean

help: ## コマンドの一覧を出す
	@awk 'BEGIN { FS = ":.*## " } /^[a-zA-Z_-]+:.*## / { printf "  make %-14s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## ツール（.tool-versions）と依存パッケージを入れる
	mise install
	vp install

install: ## 依存パッケージを入れる
	vp install $(ARGS)

dev: ## 開発サーバを起動する（下書きも見るなら SHOW_DRAFTS=true make dev）
	vp run dev $(ARGS)

build: ## 本番と同じビルドをする（dist/）
	vp run build $(ARGS)

preview: ## ビルドして、手元で Workers として動かす
	vp run preview $(ARGS)

deploy: ## ビルドして Cloudflare に手動でデプロイする（ふだんは Workers Builds が行う）
	vp run deploy $(ARGS)

# 順番に意味があるので（型の生成 → 検査、ビルド → 出力の検査）、前提ではなく 1 つずつ呼ぶ。
# 入れ子の make に ARGS が引き継がれないよう、ARGS= で空にする。
check: ## CI と同じ検査をすべて回す（typecheck → lint → test → build → check-output）
	$(MAKE) typecheck ARGS=
	$(MAKE) lint ARGS=
	$(MAKE) test ARGS=
	$(MAKE) build ARGS=
	$(MAKE) check-output ARGS=

typecheck: ## .astro を含めて型を検査する（astro check。型の生成もする）
	vp run typecheck $(ARGS)

lint: ## フォーマット・静的検査・型検査をまとめて回す（vp check）
	vp check $(ARGS)

fmt: ## フォーマットのずれだけを検査する
	vp fmt --check $(ARGS)

fmt-fix: ## フォーマットと、自動で直せる静的検査の指摘を直す
	vp check --fix $(ARGS)

test: ## テストを回す（Vitest）
	vp test $(ARGS)

check-output: ## ビルド結果（dist/）を検査する（make build の後）
	vp run check-output $(ARGS)

outdated: ## 新しい版がある依存パッケージを一覧する
	vp outdated $(ARGS)

update: ## 依存パッケージを、package.json の範囲で新しくする
	vp update $(ARGS)

clean: ## ビルド結果と生成物を消す
	rm -rf dist .astro
