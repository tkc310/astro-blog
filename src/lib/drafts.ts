// 下書きを出すかどうか（ADR-0005）。本番（main）のビルドでは出さず、プレビューでだけ出す。
// Workers Builds はビルド中に WORKERS_CI_BRANCH を入れる。手元では SHOW_DRAFTS=true で出せる。

type Env = Record<string, string | undefined>;

export const PRODUCTION_BRANCH = "main";

export function shouldShowDrafts(env: Env): boolean {
  if (env.SHOW_DRAFTS === "true") return true;
  if (env.SHOW_DRAFTS === "false") return false;
  const branch = env.WORKERS_CI_BRANCH;
  return branch !== undefined && branch !== "" && branch !== PRODUCTION_BRANCH;
}

export function isVisible(entry: { data: { draft: boolean } }, showDrafts: boolean): boolean {
  return showDrafts || !entry.data.draft;
}
