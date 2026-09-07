# エージェント委任ガイド（Cursor）

Cursor Agent へ作業を委任するときの標準テンプレートと運用方針です。
入口は [AGENTS.md](../AGENTS.md)、常時規約は [.cursor/rules/project-core.mdc](../.cursor/rules/project-core.mdc) です。

## 標準実行フロー

作業は **設計フェーズ** と **実装フェーズ** の2段階で進めます。

```
【設計フェーズ】
Issue読み取り → `.specify/specs/<feature>/` に spec/plan/tasks → 自己レビュー → ★ユーザー確認（必須停止）

【実装フェーズ（ユーザー承認後）】
worklog 起票 → 実装 → テスト → 動作確認 → npm run build
→（明示依頼後）コミット → push → PR作成
```

途中で失敗した場合は原因を解消してから次工程へ進み、未解消のままコミット・push しないこと。
**commit / push / PR はユーザー明示依頼時のみ** 実行する。

---

## 委任テンプレート（コピー用）

### 設計フェーズの依頼

```
Issue #<番号> の概要に基づいて設計資料を作成してください。
`.specify/specs/<feature>/` に spec.md / plan.md / tasks.md を作成し、自己レビュー結果も提示してください。
設計完了時点で worklog を作成し、その存在を自己レビュー項目に含めてください。
設計フェーズ完了後は私の確認を待ってください。
```

### 実装フェーズの依頼（設計承認後）

```
設計を承認します。実装・テスト・動作確認まで進めてください。
軽微な実装判断は既存実装準拠で自動判断してください。
npm run build は毎回実行し、可能なら npm run lint と npm test も実行してください。
コミット・push・PR作成は私が依頼したときのみ実行してください（ベースブランチ: develop）。
破壊的変更・機密情報関連・要件矛盾が発生した場合は確認して止まってください。
```

### PR マージ後の後処理

```text
main 反映を確認したうえで、未マージのブランチは残し、マージ済みの作業ブランチのみ削除してください。
```

---

## 停止条件

| 条件 | フェーズ | 内容 |
|------|----------|------|
| 設計フェーズ完了 | 設計 | 自己レビュー後、worklog 確認を含めて必ずユーザー確認（必須） |
| 要件矛盾 | 両方 | 既存仕様と指示が明確に矛盾している |
| 破壊的変更 | 両方 | データ移行・スキーマ変更・公開I/F変更が伴う |
| 高リスク変更 | 両方 | 認証・認可・機密情報に関わる変更 |
| 環境不足 | 実装 | 外部権限・環境起因で検証が不可能 |
| ブランチ粒度の競合 | 実装 | 命名や粒度に複数の妥当案があり運用影響が大きい |

---

## 検証コマンド一覧

| コマンド | タイミング |
|----------|-----------|
| `npm run build` | コミット前（必須） |
| `npm run lint` | コミット前（可能なら） |
| `npm test` | コミット前（可能なら） |
| `npm run check:local-pages` | UI変更後（local Supabase 起動が必要） |

---

## PR本文に必須の記載項目

1. 設計概要（目的・対象・影響範囲）
2. 実装概要（変更内容の要約）
3. 実行した検証コマンドと結果
4. 手動または自動の動作確認内容
5. 既知の未解決事項

---

## Cursor 向けスキル

- `.cursor/skills/issue-implementation-runbook/` — 実装フェーズ手順
- `.cursor/skills/spec-kit-workflow/` — Spec Kit フロー

---

## 関連ファイル

- [AGENTS.md](../AGENTS.md) — 入口
- [.github/agent-instructions.md](../.github/agent-instructions.md) — 運用ルール詳細（CI 必須）
- [.cursor/rules/project-core.mdc](../.cursor/rules/project-core.mdc) — 常時適用規約
- [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) — PRテンプレート
