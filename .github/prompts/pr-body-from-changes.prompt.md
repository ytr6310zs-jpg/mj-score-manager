---
mode: agent
description: "Generate a PR body from current changes in this repository using the required template sections and validation results."
---

現在の変更差分をもとに、このリポジトリの運用ルールに沿った PR 本文を作成してください。

要件:
- 必須セクションをこの順序で出力する。
  1. 設計概要
  2. 実装概要
  3. 実行した検証コマンドと結果
  4. 手動動作確認の内容
  5. 既知の未解決事項
  6. Worklog
  7. 関連 Issue
- 実行済みコマンドが不足する場合は、未実施として理由を明記する。
- 事実不明の内容は断定しない。
- 箇条書き中心で簡潔にまとめる。

参照:
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/copilot-instructions.md`
- `docs/issue-prompt-guidelines.md`

出力形式:
- Markdown のみ
- そのまま PR 本文に貼れる完成形
