---
title: Issue #279 .cursorignore / commands — タスク
---

- T1: Spec 配置 — Done 条件: `.specify/specs/issue-279-cursorignore-commands/` に spec/plan/tasks がある
- T2: `.cursorignore` 作成 — Done 条件: plan の除外リストを満たす
- T3: commands 作成 — Done 条件: clarify/design/implement.md があり、設計停止・明示 commit 方針と整合
- T4: `AGENTS.md` 更新 — Done 条件: Commands 節とディレクトリ説明がある
- T5: 検証と PR — Done 条件: `npm run build` 成功、設計+実装を含む `develop` 向け PR がある（Closes #279）
- T6（追加）: `/pr` コマンド — Done 条件: commit/push/PR 手順の slash command と `AGENTS.md` 追記がある
- T7（追加）: `/release` コマンド — Done 条件: develop→main のリリース PR 作成・マージ手順がある（機能PR→develop は含まない）
