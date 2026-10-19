---
name: conventional-commits
description: Write commit messages in Conventional Commits. Use whenever creating a commit in this repository, including commits made by the improve, write-spec, and write-post skills.
---

# Conventional Commits

Every commit in this repository follows Conventional Commits. The human-facing rules are in `CONTRIBUTING.md` (「コミットメッセージ」). Once the scaffold exists, a `commit-msg` hook and CI (`vp run lint-commits`) will reject other messages.

Use `type(scope): description`.

- The type is one of `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `post`, `build`, `ci`, `chore`, or `revert`. Use `post` for adding or updating blog articles only.
- The scope is optional and names the area in lowercase letters, digits, and `-`, such as `post`, `seo`, `cms`, `layout`, `deploy`, or `migrate`.
- Add `!` after the type or scope for a breaking change, such as `feat(seo)!: ...`. Changing a published URL counts as breaking.
- The description is imperative and has no trailing period (`.` or `。`). Japanese or English is fine.
- Keep one concern in each commit. Split unrelated changes into separate commits.
- Leave a blank line before the body. Put attribution trailers at the end of the body.

## Examples

```
feat(post): 記事詳細に目次を付ける
fix(seo): BlogPosting の dateModified を updatedDate から出す
docs: ADR-0011 を足す
post: Astro 7 への移行メモを公開する
```
