# Requirements Checklist: Issue #305

## Content Quality

- [x] No blocking NEEDS CLARIFICATION in FR
- [x] Requirements testable
- [x] Success criteria measurable
- [x] Edge cases identified
- [x] Scope bounded（削除しない／専用 E2E は捨てる／共有ドメインは維持）

## Feature Readiness

- [x] D1–D3（deprecate / 画面内記載 / ログイン先）は Issue コメント由来
- [x] D4–D7（非保証・専用テスト削除・積極メンテ禁止・必要時のみ改修）を Spec に記載
- [x] D1–D7 / R1–R6 がユーザー承認済み（`/implement`）
- [x] エージェント向け常時ルール更新が tasks（US4）に含まれる
- [x] 専用 E2E 削除が tasks に含まれる
- [x] 削除・機能停止が非スコープ、共有 saveScoreAction は維持

## Notes

- 設計ゲート: #306 マージ後に develop ⊆ main 確認済み
- 当日 worklog: 設計起票済み（実装開始時に実装タグで追記）
