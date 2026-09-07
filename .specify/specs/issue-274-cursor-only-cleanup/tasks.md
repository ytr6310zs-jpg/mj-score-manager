---
title: Issue #274 Cursor 専用化 — タスク
---

- T1: Spec 配置 — Done 条件: `.specify/specs/issue-274-cursor-only-cleanup/` に spec/plan/tasks がある
- T2: 必須ファイルリネーム — Done 条件: `.github/agent-instructions.md` が存在し、旧 `copilot-instructions.md` が無い。Git 方針が Cursor 整合
- T3: CI/husky/package/PRテンプレ更新 — Done 条件: `check:required-files` と `required-files.yml` / pre-commit / PULL_REQUEST_TEMPLATE が新パスを参照
- T4: ドキュメント入口の Cursor 専用化 — Done 条件: AGENTS.md / README / agent-delegation-guide / issue-prompt-guidelines / constitution / app-spec が新正本を指す
- T5: deprecated 明示 — Done 条件: `.github/instructions/README.md` と `.github/prompts/README.md` がある
- T6: VS Code Copilot 設定除去 — Done 条件: `.vscode/settings.json` に `github.copilot.*` が無い
- T7: 参照漏れの更新 — Done 条件: `.github/skills/` / `speckit.plan.agent.md` / `init-options.json` の現行参照が新パス
- T8: 検証と PR — Done 条件: `npm run check:required-files` と `npm run build` が成功し、`develop` 向け PR がある
