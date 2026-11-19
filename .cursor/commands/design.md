# Design Feature

指定 Issue の **設計フェーズのみ** を実施します。実装は禁止です。

## Spec 作成前ゲート（必須）

古い `develop` のまま Spec を書き始めない。詳細の判断根拠は Issue #296。

### なぜ同期が必要か

きっかけは hooks が `main` にだけあると fail-closed になることだったが、**原因は hooks 専用ではない**。  
`/release` で `develop` → `main` を merge コミットすると、ツリーが同一でも `main` 先端のマージコミットが `develop` に含まれず、包含チェックが失敗する。  
予防の正本は `.cursor/commands/release.md` の「リリース後の develop 同期」。本ゲートの sync PR は、同期漏れ時のリカバリである。

1. 作業ツリーがクリーンであること。未コミット変更がある場合は停止して報告する
2. `git fetch origin main develop`
3. `origin/develop` が `origin/main` を含むか確認する  
   （例: `git merge-base --is-ancestor origin/main origin/develop`）
4. **含む場合**: tip は `origin/develop`。次の「機能ブランチ作成」へ
5. **含まない場合**:
   1. ローカルで `develop` を更新し、`origin/main` を取り込む（FF 優先。衝突なら自動解消せず停止・報告）
   2. `git push origin develop` を試行する（無条件の黙った push はしない）
   3. **push 成功**: 更新後 tip から機能ブランチへ
   4. **push 失敗**（protected branch 等）または **衝突**: Spec 作成に進まず停止・報告する  
      - 推奨リカバリ: `chore/sync-main-into-develop`（または同等）で `develop` 向け sync PR を作成し、マージ完了まで待つ。同趣旨の open PR があればそれを案内し新規を乱立しない
      - ツリーが同一（`origin/main^{tree}` == `origin/develop^{tree}`）でも包含チェックは失敗しうる。その場合も「差分なしの同期」として上記リカバリを行い、古い tip のまま Spec を書き始めない
6. 確認後 tip から機能ブランチを切る  
   - 既定: `feature/issue-<番号>-<要約>`  
   - Cloud Agent 等で別命名規則（例: `cursor/<要約>-<suffix>`）が指示されている場合はそちらを優先
7. **このブランチ上でのみ** Spec 3 点を作成する

## 手順

1. Issue 番号とスコープを確認する（GitHub MCP / `gh` 可）
2. 上記ゲートを完了する
3. `.specify/specs/<feature>/` に次を作成する（テンプレート: `.specify/templates/`）:
   - `spec.md`
   - `plan.md`
   - `tasks.md`
4. スキル `.cursor/skills/spec-kit-workflow/SKILL.md` と `.github/agents/speckit.*.agent.md` を必要に応じて参照する
5. 出力する:
   - 変更予定ファイル一覧
   - 自己レビュー（整合性 / 抜け漏れ / リスク）
   - 実装フェーズの想定手順
6. 設計完了時点で当日 worklog の起票有無を自己レビューに含める
7. **必ず停止し、ユーザー承認を待つ**

## 制約

- 実装・コミット・push・PR 作成はしない（ユーザーが設計 PR へのコミットを明示依頼した場合を除く）
- ゲート未通過（未同期 develop・衝突・develop push 不可）のまま Spec を作成しない
- 参照: `docs/agent-delegation-guide.md`, `.cursor/rules/project-core.mdc`
