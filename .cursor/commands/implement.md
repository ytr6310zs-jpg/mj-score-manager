# Implement Feature

設計承認済み（または **変更クラス A/B かつトリアージ合意済み** で設計承認スキップ）Issue の **実装フェーズ** を実施します。

マトリクス正本: `docs/issue-prompt-guidelines.md`（Issue #308）。

## 開始前チェック

1. 出力冒頭に **合意クラス（A–D）** とトリアージ合意の有無を再掲する
2. **C / D**: ユーザーの設計承認があること。未承認なら停止して確認する  
   **A / B**: トリアージ（または委任文面）でクラス合意済みであること。未合意なら停止して `/triage` へ戻る
3. Spec:
   - **C / D**: `.specify/specs/<feature>/` に `spec.md` / `plan.md` / `tasks.md` があること
   - **B**: 薄い Spec 3点を推奨（無い場合は PR Spec で進める旨を明記）
   - **A**: Spec 3点任意（PR Spec 可）
4. 当日 worklog を起票:
   `npm run worklog:start -- --summary "Issue #<番号> 実装開始" --reason "..." --tags "issue-<番号>,implementation,worklog"`

## 手順

1. スキル `.cursor/skills/issue-implementation-runbook/SKILL.md` に従う
2. `tasks.md`（または合意したスコープ）の順序で最小差分実装する
3. 変更種別に応じてテスト / 手動確認を行う
4. `npm run build` を必須実行（可能なら `npm run lint` / `npm test`）
5. 結果を要約して提示する

## 制約

- **commit / push / PR はユーザー明示依頼時のみ** 実行する（依頼時は `/pr`、develop→main は `/release`）
- `/release` をトリアージ合意や本コマンドで代替しない（常に人間承認）
- 実装中に差分が高リスク化したら fail-up し、必要なら設計承認停止に戻る
- 破壊的変更・認証/機密・要件矛盾では停止して確認する
- 参照: `docs/agent-delegation-guide.md`, `.cursor/rules/project-core.mdc`, `.github/agent-instructions.md`, `.cursor/commands/triage.md`
