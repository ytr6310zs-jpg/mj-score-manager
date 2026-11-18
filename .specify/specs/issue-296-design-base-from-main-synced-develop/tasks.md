---
title: Issue #296 — タスク
issue: 296
feature_branch: cursor/issue-296-design-base-from-main-f5e5
---

- T1: Spec 配置 — Done 条件: `.specify/specs/issue-296-design-base-from-main-synced-develop/` に `spec.md` / `plan.md` / `tasks.md` がある（本設計）
- T2: `/design` 正本更新 — Done 条件: `.cursor/commands/design.md` に Spec 作成前の fetch・包含確認・マージ試行・push 成否・衝突/push 不可時停止・sync PR リカバリ・ブランチ命名（Cloud Agent 例外含む）が書かれている
- T3: 常時ルール短記 — Done 条件: `.cursor/rules/project-core.mdc` に `/design` 開始時ゲートの一行以上があり、詳細は `design.md` 参照になっている
- T4: AGENTS 短記 — Done 条件: `AGENTS.md` の Commands または Git 方針に同趣旨の短い記載がある
- T5: 委任ガイド（任意だが推奨）— Done 条件: `docs/agent-delegation-guide.md` の設計フェーズに Spec 前ゲートへの言及がある。不要と判断した場合は PR に理由を書く
- T6: 検証と PR — Done 条件: `npm run build` 成功、`develop` 向け PR に設計概要・実装概要・検証結果・手動確認・未解決（#294 非含有・develop sync 状態）を記載。Closes #296

依存
--
- T2–T5 は設計承認後
- T6 は T2–T4 完了後（T5 スキップ可）
- #294 再開は本 Issue マージ後（および必要なら `develop` が `main` を含む状態になってから）
