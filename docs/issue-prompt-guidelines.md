**Issue対応プロンプトガイド（運用強化版）**

- **目的:** Issue 対応で「設計漏れ」「worklog漏れ」「承認前実装」を防ぎ、エージェントが毎回同じ手順で確実に実行できるようにする。
- **前提:** リポジトリ運用ルールは [.github/copilot-instructions.md](../.github/copilot-instructions.md) に従う。

**基本方針（必須）**
- フェーズは必ず 2 段階: 設計フェーズ -> 実装フェーズ
- 設計フェーズ完了時は必ず停止し、ユーザー承認を待つ
- 実装開始前に Spec Kit 3点セットを揃える（`.specify/specs/<feature>/spec.md`, `.specify/specs/<feature>/plan.md`, `.specify/specs/<feature>/tasks.md`）
- 実装開始時点で当日 worklog を起票する（`npm run worklog:start -- --summary "..." --reason "..." --tags "issue-<番号>,..."`）
- PR 本文には必須項目 + Worklog 記載を入れる

---
**推奨フロー**

1. `Clarify`（不明点解消）
2. `Design`（spec/plan/tasks 作成 + 自己レビュー + 停止）
3. `Implement`（承認後のみ実施、worklog 起票して開始）
4. `PR`（必須項目と worklog 記載を入れる）

---
**テンプレート例（コピペ用）**

1) Clarify（確認用）

```text
Issue # を対応します。次を教えてください。
1) 目的の要約
2) 期待挙動（現状と理想）
3) 優先度・期限
4) CI/運用上の制約

不明点があれば5つの確認質問（それ以上でも可）を先に提示してください。
```

2) Design（設計フェーズ専用・実装禁止）

```text
Issue # の設計フェーズのみ実施してください。

要件:
- `.specify/specs/<feature>/spec.md`
- `.specify/specs/<feature>/plan.md`
- `.specify/specs/<feature>/tasks.md`
を作成してください。

出力:
- 変更ファイル一覧
- 自己レビュー（整合性/抜け漏れ/リスク）
- 実装フェーズの想定手順

制約:
- 実装・コミット・push・PR作成はしない
- 設計フェーズ完了時点で必ず停止し、私の承認を待つ
```

3) Implement（実装フェーズ専用）

最短で依頼する場合は、この章のテンプレートをそのまま送ってください。

```text
Issue # は設計承認済みです。実装フェーズを実施してください。

開始前チェック:
1) spec/plan/tasks の3点が存在すること
2) 当日worklogを起票すること
	`npm run worklog:start -- --summary "Issue # 実装開始" --reason "..." --tags "issue-<番号>,implementation,worklog"`

実施内容:
- tasks.md に従って最小差分で実装
- テスト/動作確認
- `npm run build` を必須実行
- 可能なら `npm test` と `npm run lint` も実行
- コミット -> push -> PR作成まで実施
- 作業内容をworklogに追加

PR本文必須:
- 設計概要
- 実装概要
- 実行した検証コマンドと結果
- 手動動作確認の内容
- 既知の未解決事項
- Worklog（記録先と内容）
```

4) PR本文テンプレ（必須）

```text
設計概要:
- <要約>
- Spec Kit: `.specify/specs/<feature>/spec.md` / `plan.md` / `tasks.md`

実装概要:
- <追加/変更ファイル>

実行した検証コマンドと結果:
- npm run build: <成功/失敗>
- npm test: <成功/失敗/未実施理由>
- npm run lint: <成功/失敗/未実施理由>

手動動作確認の内容:
- <確認手順と結果>

既知の未解決事項:
- <なし / 内容>

Worklog:
- `.worklog/logs/YYYY-MM-DD.md` に記録済み
- <必要なら要点>

関連 Issue:
- #
```

5) PR マージ後の後処理

```text
PR が main にマージされたら、develop を除く取り込み済みブランチをローカル・リモート両方から削除してください。
削除前に main 反映を確認し、未マージのブランチは削除しないでください。
```

必要に応じて、PR本文では次の補足も追記してください。

- 変更の背景や判断理由
- CI ランや手動確認の具体的な結果
- 破壊的変更や移行手順がある場合の注意点

---
**運用チェックリスト（作業者向け）**
- 設計前に Clarify を実施した
- spec/plan/tasks を作成した
- 設計完了後に停止して承認を得た
- 実装開始時に当日 worklog を起票した
- build/test/lint の実行結果を記録した
- PR本文に必須項目と Worklog を記載した
- PR マージ後のブランチ削除条件を明記した

---
**注記**
- 機密情報はプロンプトやドキュメントに含めないこと。
- 失敗したコマンドや未実施項目は、理由を PR 本文に必ず明記すること。

---
**関連カスタマイズ（任意）**
- PR本文を差分から自動生成する場合: `.github/prompts/pr-body-from-changes.prompt.md`
- 実装フェーズの手順を固定する場合: `.github/skills/issue-implementation-runbook/SKILL.md`
