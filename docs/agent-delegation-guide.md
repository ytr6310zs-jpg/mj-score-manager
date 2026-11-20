# エージェント委任ガイド（Cursor）

Cursor Agent へ作業を委任するときの標準テンプレートと運用方針です。
入口は [AGENTS.md](../AGENTS.md)、常時規約は [.cursor/rules/project-core.mdc](../.cursor/rules/project-core.mdc) です。

変更クラス（A–D）と設計承認スキップの正本は [issue-prompt-guidelines.md](./issue-prompt-guidelines.md)（Issue #308）。

## 標準実行フロー

作業は **トリアージ** → **設計フェーズ** → **実装フェーズ** で進めます。

```
【トリアージ】
Issue 読取 → 変更クラス A–D 判定 → 必須承認点提示 → ★ユーザー合意

【設計フェーズ】
main 取り込み済み develop から機能ブランチ作成（未同期なら停止）
→ クラスに応じた Spec（C/D は 3点必須。A は PR Spec 可）→ 自己レビュー
→ C/D・未合意: ★ユーザー確認（必須停止）
→ A/B 合意済み: 設計承認停止を省略可

【実装フェーズ】
worklog 起票 → 実装 → テスト → 動作確認 → npm run build
→（明示依頼後）コミット → push → PR作成

【リリース（明示依頼）】
/release → 常に人間承認（クラス不問。トリアージ合意で代替不可）
```

`/triage` の正本は `.cursor/commands/triage.md`。  
`/design` の Spec 作成前ゲート（fetch・包含確認・衝突/push 不可時停止・sync PR リカバリ）の正本は `.cursor/commands/design.md`。  
`/release` 後の `main` → `develop` 同期の正本は `.cursor/commands/release.md`（未同期のままリリース完了にしない）。  
スコア入力 UI（`/`）は deprecate・非保証。積極改修しない（正本: `.cursor/rules/project-core.mdc` / `AGENTS.md`）。

途中で失敗した場合は原因を解消してから次工程へ進み、未解消のままコミット・push しないこと。
**commit / push / PR はユーザー明示依頼時のみ** 実行する。

---

## 委任テンプレート（コピー用）

### トリアージの依頼

```
Issue #<番号> を /triage してください。変更クラス（A–D）の案・根拠・必須承認点を提示し、私の合意を待ってください。
実装・コミットはしないでください。
```

事前クラス合意の例:

```
この Issue は変更クラス B でトリアージ済み（合意済み）として進めてください。
```

### 設計フェーズの依頼

```
Issue #<番号> の概要に基づいて設計資料を作成してください。
先に main 取り込み済みの develop から機能ブランチを切り（未同期・衝突・develop push 不可なら停止）、
そのブランチ上で `.specify/specs/<feature>/` に spec.md / plan.md / tasks.md を作成し、自己レビュー結果も提示してください
（クラス A で PR Spec のみの場合は 3 点任意）。
設計完了時点で worklog を作成し、その存在を自己レビュー項目に含めてください。
クラス C/D またはトリアージ未合意の場合、設計フェーズ完了後は私の確認を待ってください。
クラス A/B かつトリアージ合意済みの場合は、設計承認停止を省略して構いません。
```

### 実装フェーズの依頼（設計承認後、または A/B 合意済み）

```
設計を承認します（またはクラス A/B トリアージ合意済みで設計承認スキップ）。実装・テスト・動作確認まで進めてください。
冒頭で合意クラスを再掲してください。
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
| トリアージ未完了で A/B スキップしようとする | 設計/実装 | クラス合意がない。`/triage` へ戻る |
| 設計フェーズ完了 | 設計 | **C/D・未合意は必須停止**。A/B 合意済みは省略可 |
| 要件矛盾 | 両方 | 既存仕様と指示が明確に矛盾している |
| 破壊的変更 | 両方 | データ移行・スキーマ変更・公開I/F変更が伴う |
| 高リスク変更 | 両方 | 認証・認可・機密情報に関わる変更（クラス D） |
| 実装中の fail-up | 実装 | 想定より差分が大きくクラス再判定が必要 |
| 環境不足 | 実装 | 外部権限・環境起因で検証が不可能 |
| ブランチ粒度の競合 | 実装 | 命名や粒度に複数の妥当案があり運用影響が大きい |
| `/release` | リリース | **クラス不問で常に人間承認** |

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

1. 設計概要（目的・対象・影響範囲。変更クラスの記載を推奨）
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
- [issue-prompt-guidelines.md](./issue-prompt-guidelines.md) — 変更クラス正本・依頼テンプレ
- [.github/agent-instructions.md](../.github/agent-instructions.md) — 運用ルール詳細（CI 必須）
- [.cursor/rules/project-core.mdc](../.cursor/rules/project-core.mdc) — 常時適用規約
- [.cursor/commands/triage.md](../.cursor/commands/triage.md) — 変更クラス判定
- [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) — PRテンプレート
