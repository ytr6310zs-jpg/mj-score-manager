# Design Feature

指定 Issue の **設計フェーズのみ** を実施します。実装は禁止です。

変更クラス（A–D）と設計承認スキップ条件の正本: `docs/issue-prompt-guidelines.md`（Issue #308）。  
`/triage` でクラス合意済みか、委任文面で事前合意があるかを確認し、出力冒頭に **合意クラス** を再掲すること。

### 設計完了時の停止（クラス連動）

| 条件 | 設計完了時 |
|---|---|
| **C / D**、またはトリアージ **未合意** | **必ず停止**し、ユーザー承認を待つ |
| **A / B** かつトリアージ（または委任文面）で **合意済み** | 設計承認停止を **省略可**。続けて `/implement` する場合はユーザーが明示していること |
| 未合意のまま A/B 自己判定のみ | スキップ不可。停止してクラス合意を取る |

A は Spec 3点任意（PR Spec 可）。B は薄い Spec 3点推奨。C/D は Spec 3点必須。  
**commit / push / PR / `/release` はクラス不問で本コマンドでは行わない。** main↔develop 同期ゲートは緩和しない。

## Spec 作成前ゲート（必須）

古い `develop` のまま Spec を書き始めない。詳細の判断根拠は Issue #296。

### なぜ同期が必要か

きっかけは hooks が `main` にだけあると fail-closed になることだったが、**原因は hooks 専用ではない**。  
`/release` で `develop` → `main` を merge コミットすると、ツリーが同一でも `main` 先端のマージコミットが `develop` に含まれず、包含チェックが失敗する。  
予防の正本は `.cursor/commands/release.md` の「リリース後の develop 同期」。通常は Actions（Issue #318）が `main` → `develop` を自動同期する。本ゲートの sync PR は、自動化漏れ・失敗時のリカバリである。

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
7. **停止ルール（上記「設計完了時の停止」）に従う**  
   - C/D・未合意: 必ず停止しユーザー承認を待つ  
   - A/B 合意済み: 停止省略可（連続実装はユーザー明示時のみ）

## 制約

- 実装・コミット・push・PR 作成はしない（ユーザーが設計 PR へのコミットを明示依頼した場合を除く）
- トリアージ未合意のまま A/B の設計承認スキップを適用しない
- ゲート未通過（未同期 develop・衝突・develop push 不可）のまま Spec を作成しない
- 参照: `docs/agent-delegation-guide.md`, `.cursor/rules/project-core.mdc`, `docs/issue-prompt-guidelines.md`, `.cursor/commands/triage.md`
