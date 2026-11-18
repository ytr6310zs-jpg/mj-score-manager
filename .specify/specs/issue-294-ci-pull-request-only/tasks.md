---
title: Issue #294 — タスク
issue: 294
feature_branch: cursor/issue-294-ci-pull-request-only-f5e5
---

- T1: Spec 配置 — Done 条件: `.specify/specs/issue-294-ci-pull-request-only/` に `spec.md` / `plan.md` / `tasks.md` がある（本設計）
- T2: `ci.yml` の `on:` 更新 — Done 条件: `push` が無く、`pull_request.branches` が `[ main, develop ]`。ジョブ本体・concurrency・env は差分なし
- T3: `required-files.yml` の `on:` 更新 — Done 条件: `push` が無く、`pull_request.branches` が `[ main, develop ]`。`check-files` ジョブ本体は差分なし
- T4: 他 workflow 非変更の確認 — Done 条件: `check-worklog` / `check-spec` / `check-migrations` / `migrate.yml` の `on:` が変更されていない
- T5: 検証と PR — Done 条件: `npm run build` 成功、`develop` 向け PR に設計・実装・検証・未解決（直接 push の穴）を記載。Closes #294

依存
--
- T2–T5 は設計承認後
- T5 は T2–T4 完了後
