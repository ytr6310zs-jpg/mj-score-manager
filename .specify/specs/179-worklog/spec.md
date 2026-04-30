---
title: Issue-179 — 作業記録ファイルの自動生成と振り返り機能
owner: @you
created: 2026-04-30
---

背景
--
本プロジェクトではエージェント／個人での作業が混在しており、後から振り返るための作業記録が一貫して残っていません。既に `.worklog/logs/` や `scripts/extract-specs.mjs`、`docs/tools-quickstart.md` 等の関連資産が存在しますが、自動生成が守られておらず運用が安定していません。

目的
--
- コマンド実行またはコミット時に作業記録ファイル（`.worklog/logs/YYYY-MM-DD.md`）が自動生成されること
- 過去 N 日分の作業記録から振り返りレポートを生成できること
- 機密情報を記録しない仕組みと運用ルールの徹底

現状の資産（参考）
--
- `scripts/extract-specs.mjs` — 仕様抽出スクリプト（既存）
- `.worklog/logs/` — 手動で残されたログ群（既存）
- `docs/tools-quickstart.md` — ツール運用ドキュメント（既存）
- `.vscode/mcp.json` — MCP 設定（既存）

要件（高レベル）
--
1. CLI コマンド `npm run worklog:generate` を実行すると、現在の日時／ブランチ／変更ファイル一覧／作業要約（短文）／決定事項／次アクションを含む Markdown ファイルを `.worklog/logs/YYYY-MM-DD-HHMMSS.md` として出力すること
1.1. 上記ワークログは原則として agent が生成すること（agent が CLI を呼ぶ、または agent が実行するフロー内で自動作成）。人手で追記する場合は `agent:manual` メタ情報を残すこと。
2. Husky の `pre-commit` フックまたは同等の仕組みで、作業ブランチにコミットする際に直近のワークログが存在するかチェックし、存在しない場合は警告（または生成）を行うこと
3. 振り返りスクリプト `npm run worklog:summary -- --days N` が過去 N 日分を集約し、要点（合計コミット数、主要変更、未解決タスク）を生成すること
4. 生成物は機密情報（`.env*`、トークン、個人情報）をフィルタリングして保存すること
5. CI に `check-worklog` ジョブを追加し、PR に対して recent worklog の存在（PR 発行日から遡って 0 日以内のログ等）をバリデートできること（緩やかな検証ルールを採用）

受け入れ条件
--
- `npm run worklog:generate` を実行して `.worklog/logs/` にファイルが生成される（サンプル出力を PR に添付）
- `npm run worklog:summary -- --days 7` で 7 日分のサマリが生成される
- `npm run build` が成功する（コミット前条件）
- Husky (pre-commit) が有効な場合、コミット時にワークログ存在チェックが動作する

運用ルール（追記）
--
- 個人運用のため、Issue の作成者が設計・実装の最終承認者となる（`.github/copilot-instructions.md` を参照）
- 機密情報はログに含めない。ログ生成時には `.gitignore` と `.env*` を参考に漏洩しうるパスを除外する
- 小さな修正やドキュメントのみの変更はワークログルールを省略できるが、PR 本文に「Worklog: skipped (reason)」を明記すること

Agent の責務
--
- Agent は以下を満たしてワークログを生成・コミットする責務を負います（運用規約として適用）。
	- いつワークログを生成するか: Agent が Issue/タスクを処理開始した直後、及び重要な意思決定を行った直後に自動生成すること。
	- ワークログに含める必須フィールド: `datetime`, `branch`, `changed_files`, `summary`, `decisions`, `next_actions`, `agent_id`（エージェント識別子）
	- 出力フォーマット: YAML frontmatter（上記メタ） + 本文（簡易説明、コマンド履歴、参照ファイル）
	- 機密フィルタリング: `.env*` や `.git-ignored` なファイルパス、明白なトークン形式は自動で除外すること
	- コミット振る舞い: Agent が変更を加える場合は `feature/issue-<番号>-<要約>` ブランチ上で `worklog` を生成し、同一コミットまたは直後のコミットでワークログを含めること（事前にユーザー承認がある場合を除く）

Worklog テンプレート（agent 出力例）
--
```
---
datetime: 2026-04-30T15:04:22Z
branch: feature/issue-179-worklog
changed_files:
	- scripts/extract-specs.mjs
	- .specify/specs/179-worklog/spec.md
summary: "Worklog generation spec added and branch created"
decisions:
	- "Spec will require agent-generated worklogs; husky pre-commit will warn if missing"
next_actions:
	- "Implement scripts/generate-worklog.js and summary-worklog.js"
agent_id: agent/codex
---

作業詳細:
- 実行コマンド: `node scripts/generate-worklog.js --auto`
- 備考: サンプルワークログを生成
```


実施タスク（実装フェーズで実行）
--
- T1: `scripts/generate-worklog.js` を実装し、CLI として動作させる（Node.js）
- T2: `scripts/summary-worklog.js` を実装して集計機能を提供する
- T3: `package.json` に `worklog:generate` / `worklog:summary` スクリプトを追加する
- T4: Husky の `pre-commit` か `lint-staged` にチェックスクリプトを追加する（自動生成 or 警告）
- T5: `.github/workflows/check-worklog.yml` を追加して PR 時に緩やかな存在チェックを行う
- T6: ドキュメント（`docs/tools-quickstart.md` と `README.md`）に手順を追記する

検証手順
--
1. ローカルで `npm run worklog:generate` を実行 → `.worklog/logs/<file>` が生成されることを確認
2. `npm run worklog:summary -- --days 7` を実行 → サマリが出力されることを確認
3. `npm run build` を実行してビルドが通る

リスクと回避策
--
- 誤って機密を残すリスク: 生成前にフィルタルールを明文化し、CI で敏感語が含まれないか簡易チェックを行う
- 運用の強制が煩雑になるリスク: 初期は自動チェックを警告モードにし、運用安定後に fail-on-missing に変更する

参考実装メモ
--
- 出力フォーマットは YAML frontmatter + 本文の Markdown を推奨（既存ワークログと整合）
- 既存の `.worklog/logs/` のファイル例を解析して互換性を保つ
