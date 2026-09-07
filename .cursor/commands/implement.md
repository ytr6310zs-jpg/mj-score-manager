# Implement Feature

設計承認済み Issue の **実装フェーズ** を実施します。

## 開始前チェック

1. `.specify/specs/<feature>/` に `spec.md` / `plan.md` / `tasks.md` があること
2. ユーザーが設計を承認していること（未承認なら停止して確認）
3. 当日 worklog を起票:
   `npm run worklog:start -- --summary "Issue #<番号> 実装開始" --reason "..." --tags "issue-<番号>,implementation,worklog"`

## 手順

1. スキル `.cursor/skills/issue-implementation-runbook/SKILL.md` に従う
2. `tasks.md` の順序で最小差分実装する
3. 変更種別に応じてテスト / 手動確認を行う
4. `npm run build` を必須実行（可能なら `npm run lint` / `npm test`）
5. 結果を要約して提示する

## 制約

- **commit / push / PR はユーザー明示依頼時のみ** 実行する
- 破壊的変更・認証/機密・要件矛盾では停止して確認する
- 参照: `docs/agent-delegation-guide.md`, `.cursor/rules/project-core.mdc`, `.github/agent-instructions.md`
