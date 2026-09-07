# Commit / Push / Pull Request

実装完了後の **commit → push → PR 作成** を実行します。  
このコマンドの呼び出し自体が、ユーザーによる git 操作の明示依頼です。

## 開始前チェック

1. 実装が完了し、検証結果（少なくとも `npm run build`）が提示済みであること
2. 未コミットの変更があること（なければ状況を報告して停止）
3. 機密（`.env*`、トークン、鍵、個人情報）が差分に含まれていないこと

## 手順

1. 並列で確認する:
   - `git status`
   - `git diff` / `git diff --staged`
   - `git log`（直近メッセージのスタイル）
   - 必要なら `git diff develop...HEAD`（既存コミット含む場合）
2. 未実行なら `npm run build` を実行し、失敗時はコミットしない
3. 関連ファイルのみステージする（秘密情報・無関係差分は含めない）
4. リポジトリのスタイルに合わせてコミット（HEREDOC でメッセージを渡す）
5. 必要なら `git push -u origin HEAD`
6. PR が無ければ `gh pr create`（既定ベース: `develop`）。既存 PR があれば URL を返す
7. 完了後に PR URL を提示する

## PR 本文（必須）

`docs/agent-delegation-guide.md` / `.github/PULL_REQUEST_TEMPLATE.md` に沿い、少なくとも次を含める:

- 設計概要（目的・対象・影響範囲）
- 実装概要
- 検証コマンドと結果
- 手動または自動の動作確認
- 既知の未解決事項
- 関連 Issue（`Closes #N` / `Fixes #N`）

## 制約

- force push / hard reset / `--no-verify` はしない（ユーザーが明示した場合を除く）
- `main` / `master` への force push はしない
- amend はユーザー明示時、かつ未 push・自分が作った HEAD の場合のみ
- 参照: `AGENTS.md`, `.cursor/rules/project-core.mdc`
