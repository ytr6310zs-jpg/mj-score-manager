# Issue #172 設計: Workflow 整理（一覧化・振り分け・統合案）

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/172
- 作成日: 2026-04-20
- 作成者: Copilot
- 目的: `.github/workflows` の運用負荷を下げるため、現行 workflow を一覧化し、`維持 / 統合 / archive` に振り分け、統合方針を具体化する。

## 1. 現状一覧（初版）

| Workflow | 主用途 | 主トリガー | 直近実行（UTC） | 初版区分 | 補足 |
|---|---|---|---|---|---|
| `check-migrations.yml` | PR時の migration 一貫性チェック | `pull_request` | 2026-04-19 success | 維持 | 品質ゲート。常設が妥当。 |
| `ci.yml` | build/test/lint + ローカル Supabase migration 検証 | `push`, `pull_request` | 2026-04-19 success | 維持 | 基幹CI。常設必須。 |
| `required-files.yml` | 必須ファイル存在チェック | `push`, `pull_request` | 2026-04-19 success | 維持 | リポジトリ運用ルールの担保。 |
| `supabase-keepalive.yml` | Staging/Prod DB keepalive | `schedule`, `workflow_dispatch` | 2026-04-19 success | 維持 | 低頻度だが定期保守用途。 |
| `migrate-common.yml` | migrate 再利用本体 | `workflow_call` | 2026-04-03 failure（呼び出し経由） | 維持 | 呼び出し側統合後も継続利用。 |
| `import-historical-common.yml` | historical import 再利用本体 | `workflow_call` | 直接実行なし | archive | historical import 運用終了のため退役候補。 |
| `migrate-staging.yml` | staging/preview migration | `workflow_dispatch`, `push(main)` | 2026-04-19 success | 統合 | prod 側と入口重複。 |
| `migrate-prod.yml` | prod migration | `workflow_dispatch` | 2026-04-19 success | 統合 | staging 側と入口重複。 |
| `import-historical-staging.yml` | staging historical import | `workflow_dispatch` | 2026-04-08 success | archive | historical import 運用終了のため退役候補。 |
| `import-historical-prod.yml` | prod historical import | `workflow_dispatch` | 2026-04-09 success | archive | historical import 運用終了のため退役候補。 |
| `staging-reset-and-seed-players.yml` | staging reset + seed | `workflow_dispatch` | 2026-04-08 success | 統合 | prod 側と入力仕様重複。 |
| `prod-reset-and-seed-players.yml` | prod reset + seed | `workflow_dispatch` | 2026-04-09 success | 統合 | staging 側と入力仕様重複。 |

## 2. 振り分け結果（初版）

### 維持

- `check-migrations.yml`
- `ci.yml`
- `required-files.yml`
- `supabase-keepalive.yml`
- `migrate-common.yml`

理由:
- 品質ゲート/定期保守/再利用本体に該当し、削減より安定運用優先。

### 統合

- `migrate-staging.yml` + `migrate-prod.yml`
- `staging-reset-and-seed-players.yml` + `prod-reset-and-seed-players.yml`

理由:
- 環境差分のみで、機能がほぼ同一。入口 workflow を 2 本から 1 本へ集約可能。

### archive

- `import-historical-staging.yml`
- `import-historical-prod.yml`
- `import-historical-common.yml`
- `import-historical.yml`（存在する場合）

理由:
- historical import は役目を終えており、入口統合ではなく退役を優先する。
- 個人開発運用のため、段階的な移行期間は設けず即時で archive 方針とする。

## 3. 統合案（具体）

### 3.1 Migration 入口の統合

統合前:
- `migrate-staging.yml`
- `migrate-prod.yml`

統合後（提案）:
- 新規 `migrate.yml`（`workflow_dispatch` + `push(main)`）

入力案:
- `target`: `preview | staging | prod`（default: `staging`）
- `allow_repair`: `true | false`（prod は強制 false）

挙動案:
- `push(main)` 時は `target=staging` 固定で実行。
- `workflow_dispatch` 時のみ target 選択可能。
- 実体処理は `migrate-common.yml` を継続利用。

### 3.2 Reset+Seed 入口の統合

統合前:
- `staging-reset-and-seed-players.yml`
- `prod-reset-and-seed-players.yml`

統合後（提案）:
- 新規 `reset-and-seed-players.yml`（`workflow_dispatch`）

入力案:
- `target`: `staging | prod`
- `confirmation`: `RESET AND SEED`
- `run_seed_only`: `false | true`

安全策:
- `environment` を target で切替。
- 明示確認文字列 + Environment 保護ルールを維持。

## 4. archive 運用方針（即時）

個人開発前提のため移行期間は設けず、統合・退役対象は即時で整理する。

1. historical import 系 workflow を `.github/workflows-archive/` へ移動する。
2. 必要なら README または runbook に「archive 済み」であることを明記する。
3. 後日必要性が再発した場合のみ archive から復元する。

## 5. 実施ステップ（提案）

1. `migrate.yml` を追加し、`migrate-staging.yml` / `migrate-prod.yml` を即時 archive 移動。
2. `reset-and-seed-players.yml` を追加し、`staging-reset-and-seed-players.yml` / `prod-reset-and-seed-players.yml` を即時 archive 移動。
3. `import-historical-staging.yml` / `import-historical-prod.yml` / `import-historical-common.yml`（および存在する場合 `import-historical.yml`）を archive 移動。
4. README か運用 Runbook に新 workflow 名と入力ルール、archive 対象を追記。

## 6. 影響範囲とリスク

- 影響範囲:
  - `.github/workflows/*.yml`
  - 運用手順書（README or docs）

- 主リスク:
  - 手動実行時に target 指定を誤るリスク
  - 旧 workflow 呼び出し習慣による運用混乱

- 緩和策:
  - workflow 入力に強いバリデーションを追加
  - 変更後の workflow 一覧を README / issue に明示
  - prod 操作は confirmation + environment protection を維持

## 7. 完了条件（初版の到達）

- [x] 現行 workflow 一覧表を作成
- [x] `維持 / 統合 / archive` の初版振り分けを作成
- [x] 統合案を workflow ファイル単位で具体化
- [x] 統合実装（`migrate.yml` と `reset-and-seed-players.yml`）
- [x] historical import 系 workflow の archive 移行
