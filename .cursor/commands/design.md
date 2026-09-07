# Design Feature

指定 Issue の **設計フェーズのみ** を実施します。実装は禁止です。

## 手順

1. Issue 番号とスコープを確認する（GitHub MCP / `gh` 可）
2. `.specify/specs/<feature>/` に次を作成する（テンプレート: `.specify/templates/`）:
   - `spec.md`
   - `plan.md`
   - `tasks.md`
3. スキル `.cursor/skills/spec-kit-workflow/SKILL.md` と `.github/agents/speckit.*.agent.md` を必要に応じて参照する
4. 出力する:
   - 変更予定ファイル一覧
   - 自己レビュー（整合性 / 抜け漏れ / リスク）
   - 実装フェーズの想定手順
5. 設計完了時点で当日 worklog の起票有無を自己レビューに含める
6. **必ず停止し、ユーザー承認を待つ**

## 制約

- 実装・コミット・push・PR 作成はしない（ユーザーが設計 PR へのコミットを明示依頼した場合を除く）
- 参照: `docs/agent-delegation-guide.md`, `.cursor/rules/project-core.mdc`
