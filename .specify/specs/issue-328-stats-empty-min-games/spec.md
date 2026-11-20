# Feature Specification: 成績集計の空状態と共有フィルタ（minGames）

**Feature Branch**: `feature/issue-328-stats-empty-min-games`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: B（トリアージ合意済み）  
**Input**: Issue #328 / Parent #304 / Checklist G05, G07, G13

## User Scenarios & Testing

### User Story 1 - minGames「条件なし」が持続する (Priority: P1)

成績・相性で試合数を「条件なし」にしたとき、共有フィルタや再表示で 20 などに戻されない。

**Acceptance Scenarios**:

1. **Given** `/stats`（year）で minGames=20, **When** 「条件なし」を選ぶ, **Then** URL 上で明示的な「なし」が分かり、集計は minGames 未適用になる
2. **Given** 条件なしを保存した状態, **When** 同系統ページを開き直す／FilterStateSync が走る, **Then** 再び 20 に押し戻されない
3. **Given** `/compatibility`, **When** 同様に条件なしにする, **Then** 同じ持続が効く

### User Story 2 - 空状態が誤誘導しない (Priority: P1)

対局がある／フィルタで 0 件のときに「データなし＋スコア入力」だけにならない。

**Acceptance Scenarios**:

1. **Given** 期間内に対局があり minGames で行が 0 件, **When** `/stats` を見る, **Then** フィルタ由来と分かる文言で、スコア入力を勧めない
2. **Given** 本当に対局が無い, **When** `/stats` を見る, **Then** データなし文言は取り込み優先（#305）に寄せる
3. **Given** `/compatibility` がフィルタ等で空, **When** 表示する, **Then** 可能ならフィルタ／期間由来と分かる

## Requirements

- **FR-001**: 明示的な minGames 空（条件なし）を stored／URL 同期で欠落扱いにしない
- **FR-002**: stats 空状態は「真の未登録」と「条件で 0 件」を区別（または誤 CTA を出さない）
- **FR-003**: スコア入力 UI・schema・集計アルゴリズムは変更しない

## Success Criteria

- **SC-001**: 条件なし操作が押し戻されない
- **SC-002**: 対局あり＋フィルタ 0 件で deprecate CTA が出ない
