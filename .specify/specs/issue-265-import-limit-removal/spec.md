---
title: Feature Specification: Issue #265 一括インポートの取り込み上限撤廃
owner: @you
created: 2026-05-26
status: Draft
issue: #265
feature_branch: feature/issue-265-import-limit-removal
priority: P1
deadline: 2026-05-31
---

背景
--
一括インポート機能では、スプレッドシートの主表および役満テーブルの試合番号を 40 までに制限している。Issue #265 では、想定外に 40 試合を超える対局が発生したため、この上限を撤廃し、シート内に存在するデータをそのまま取り込み対象にできるようにする。

テンプレート側はすでに 80 局まで拡張済みであり、アプリ側のパーサーだけが旧上限に追従している状態である。今回の変更では、既存の 1..40 ケースを壊さずに、41 以降の試合番号も同じ取り込みフローで扱えるようにする。

目的
--
- 一括インポートで 40 試合を超える主表データを取り込めるようにする
- 役満テーブル側の試合番号も 40 の上限なしで参照できるようにする
- 既存の 1..40 入力・重複判定・プレビュー動作を維持する
- 自動テストで 40 超えケースと既存ケースの両方を担保する

ユーザーストーリー
--

### User Story 1 - 40 試合超の対局を取り込める (Priority: P1)
利用者は、スプレッドシートに 41 試合目以降の列があっても、一括インポートのプレビューと確定を通常どおり実行できる。

**Independent Test**: 41 試合目以降を含むシートを `parseSpreadsheetMatrix` で解析すると、40 を超える試合番号も `games` に含まれ、役満テーブルの対応行も紐づくことを確認できる。

**Acceptance Scenarios**:
1. **Given** 主表に 41 以降の試合列が存在する、**When** プレビューを作成する、**Then** 41 以降の試合も取り込み候補として扱われる
2. **Given** 役満テーブルに 41 以降の `gameNo` が存在する、**When** 解析する、**Then** 該当する試合に役満が紐づく
3. **Given** 既存の 1..40 のシート、**When** 解析する、**Then** 従来どおりの結果が得られる

### Edge Cases

- 主表の試合番号が 40 を超えていても、数値として正しい列はすべて対象にする
- 役満テーブルの `gameNo` が 40 を超えていても、対応する試合があれば警告なしで紐づける
- 数値でない列見出しや、参加人数が 3/4 以外の試合は従来どおりスキップする
- 試合番号の連番欠損や重複は、現行の挙動を変えずに扱う

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse main header row game numbers without a hard upper bound of 40
- **FR-002**: System MUST accept yakuman table rows whose `gameNo` exceeds 40, as long as対応する試合が存在する
- **FR-003**: System MUST continue to enforce the existing lower bound and参加人数 validation for parsed games
- **FR-004**: System MUST keep preview / confirm / duplicate detection behavior unchanged for existing 1..40 inputs
- **FR-005**: System MUST update user-facing warning text so it no longer implies the import limit is 40
- **FR-006**: System MUST add automated regression coverage for both existing 1..40 cases and 41+ cases

### Key Entities *(include if feature involves data)*

- **ParsedSpreadsheetGame**: 1 試合分の主表データ。`gameNo` が 40 を超えていても扱える必要がある
- **ParsedSpreadsheetPayload**: 解析後のシート全体の結果。`games` 配列に 41 以降の試合が含まれる
- **Yakuman selection row**: 役満テーブルの 1 行。`gameNo` で試合へ紐づく

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 41 試合目以降を含むシートを解析したとき、該当試合が `games` に含まれる
- **SC-002**: 既存の 1..40 入力が 100% 回帰なく通る
- **SC-003**: 自動テストで 40 超えケースと既存ケースの両方を検証できる
- **SC-004**: `npm run build` が成功し、少なくとも parser 変更に対する回帰検証が可能である

## Assumptions

- テンプレート側の 80 局拡張は完了済みで、アプリ側だけを追従すればよい
- 今回は UI のレイアウトや入力方式は変更しない
- 試合番号は正の整数として扱い、上限はアプリ側で固定しない
- 一括インポートの既存の重複判定、権限制御、選択フローは変更しない