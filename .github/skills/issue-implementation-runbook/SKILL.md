---
name: issue-implementation-runbook
description: "Use when: implementing an approved GitHub Issue end-to-end in this repository (worklog start, minimal diff implementation, verification, commit/push, PR body requirements)."
---

# Issue Implementation Runbook

このスキルは、このリポジトリで設計承認後の実装フェーズを通しで進めるための手順です。
既存ルールを複製せず、必要箇所へリンクして実行順のみを固定します。

## Input

- Issue 番号
- 対象 spec ディレクトリ（`.specify/specs/<feature>/`）
- 実装対象のスコープ（UI/API/DB/バッチ）

## Step 1: Preconditions

- 設計3点 (`spec.md` / `plan.md` / `tasks.md`) が存在するか確認する。
- 参照:
  - `.github/copilot-instructions.md`
  - `docs/agent-delegation-guide.md`
  - `docs/issue-prompt-guidelines.md`

## Step 2: Start Worklog

- 実装着手前に当日 worklog を起票:
  - `npm run worklog:start -- --summary "Issue #<番号> 実装開始" --reason "..." --tags "issue-<番号>,implementation,worklog"`

## Step 3: Implement With Minimal Diff

- `tasks.md` の順序と依存関係を守る。
- 無関係なリファクタやフォーマット変更を避ける。
- 認証・認可・機密情報に触れる場合はリスクを明記する。

## Step 4: Verify

- 必須: `npm run build`
- 可能なら: `npm run lint`、`npm test`
- 変更種別に応じて必要な手動確認を記録する。

## Step 5: Commit, Push, PR

- ビルド成功後にコミットする。
- push 後、PR 本文に以下を必ず記載する:
  - 設計概要
  - 実装概要
  - 実行した検証コマンドと結果
  - 手動動作確認の内容
  - 既知の未解決事項
  - Worklog 記録

## Output Checklist

- [ ] 実装差分が最小
- [ ] `npm run build` 成功
- [ ] PR 本文の必須項目を充足
- [ ] `.worklog/logs/YYYY-MM-DD.md` に記録あり
