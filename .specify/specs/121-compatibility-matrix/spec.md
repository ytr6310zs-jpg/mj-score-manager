# Feature Specification: 相性表（プレーヤー間戦績マトリクス）

**Feature Branch**: `feature/issue-121-compatibility-matrix`  
**Created**: 2026-05-08  
**Status**: Draft  
**Issue**: #121

---

## User Scenarios & Testing

### User Story 1 - 相性表マトリクスの閲覧 (Priority: P1)

ログイン済みユーザーが「相性表」ページを開き、フィルタ条件（全期間デフォルト）で全プレーヤー間の勝敗戦績をマトリクス形式で確認する。

**Why this priority**: 本機能の中核であり、これなしで他のストーリーは成立しない。

**Independent Test**: `/compatibility` にアクセスしてマトリクス表が表示されること

**Acceptance Scenarios**:

1. **Given** ログイン済みユーザーがいる、**When** `/compatibility` へアクセス、**Then** 行・列にプレーヤー名が表示されたマトリクス表が描画される
2. **Given** プレーヤー A が rank1、プレーヤー B が rank3 で同一ゲームに参加した、**When** 相性表を表示、**Then** A vs B セル: "1勝0敗 / 100%"、B vs A セル: "0勝1敗 / 0%"
3. **Given** A と B が同着順（同一ゲームで rankA === rankB）、**When** 相性表を表示、**Then** A vs B セル: "0勝0敗1分け / 0%"（分け数は0以外のとき表示）
4. **Given** 行と列が同一プレーヤー（対角線）、**When** 相性表を表示、**Then** セルに「-」を表示
5. **Given** 未ログインユーザー、**When** `/compatibility` へアクセス、**Then** ログインページへリダイレクト

---

### User Story 2 - フィルタによる絞り込み (Priority: P2)

ユーザーが日付範囲・トーナメントフィルタを変更し、特定期間・大会のみの相性データを確認する。

**Why this priority**: 成績集計と同様のフィルタ体験を提供することで一貫したUXが得られる。

**Independent Test**: フィルタ変更後にURLパラメータが更新されマトリクスが再計算されること

**Acceptance Scenarios**:

1. **Given** 相性表が表示されている、**When** DateRangeFilter で "2026年" を選択、**Then** 2026年内のゲームのみを対象とした戦績が再表示される
2. **Given** 特定トーナメントを選択、**When** 相性表を表示、**Then** そのトーナメントの試合のみを集計した戦績が表示される

---

### User Story 3 - ヘッダーからの遷移 (Priority: P3)

グローバルヘッダーの「相性表」ボタンから相性表ページへ遷移できる。

**Why this priority**: アプリ内ナビゲーションの一貫性に必要。

**Acceptance Scenarios**:

1. **Given** ログイン済みユーザー、**When** ヘッダーの「相性表」をクリック、**Then** `/compatibility` へ遷移し、ボタンがアクティブ状態になる

---

### Edge Cases

- 対局データが0件の場合 → 「データがありません」等のメッセージを表示
- プレーヤーが1人のみ（マトリクスが 1×1）→ 正常表示（対角線のみ `-`）
- プレーヤー間でゲームが存在しないペア（両者が同じゲームに一度も参加していない）→ セルを空（`-`）表示
- 勝数・敗数が両方0（分けのみ）→ 勝率 0%
- wins + losses = 0 の場合（分けのみ）→ 0除算回避: 勝率 0%

---

## Requirements

### 機能要件

| ID | 要件 |
|---|---|
| F-01 | `/compatibility` に新規ページを追加する |
| F-02 | 行プレーヤー × 列プレーヤーのマトリクス表を表示する |
| F-03 | 各セルに「X勝X敗（X分け） / 勝率X%」を表示する。分けが0の場合は分け表示を省略 |
| F-04 | 勝率 = 勝数 ÷ (勝数 + 敗数) × 100。wins+losses=0 の場合は 0% |
| F-05 | 対角線（同一プレーヤー）セルは「-」を表示 |
| F-06 | 対局データが存在しないペアのセルは「-」を表示 |
| F-07 | DateRangeFilter（既存コンポーネント）をそのまま利用し、成績集計と同等のフィルタを提供 |
| F-08 | グローバルヘッダーに「相性表」ナビリンクを追加 |
| F-09 | 未ログインユーザーはアクセス不可（既存ミドルウェアで実現）|
| F-10 | admin / editor / viewer 全ロールが閲覧可能 |

### 非機能要件

| ID | 要件 |
|---|---|
| N-01 | モバイル・デスクトップともにスクロール対応（テーブルは `overflow-x-auto` でラップ）|
| N-02 | 既存の Tailwind / コンポーネントスタイルに準拠 |
| N-03 | Server Component + Server Action パターン（stats ページと同様）|

---

## 勝敗判定ロジック

同一ゲーム内の全プレーヤー組み合わせペア `(i, j)` を列挙（`i < j`）し、順位を比較する。

```
games テーブルのカラム: player1〜player4 (TEXT), rank1〜rank4 (SMALLINT)
player_count が 3 なら player4/rank4 は NULL
```

各ゲームで有効プレーヤーリスト（NULL 除外）を生成し、全ペア組み合わせを評価：
- `rank_i < rank_j` → A[i] の勝ち、A[j] の負け
- `rank_i > rank_j` → A[i] の負け、A[j] の勝ち
- `rank_i === rank_j` → 分け（両者に +1 draw）

集計構造：
```typescript
type MatchupRecord = {
  wins: number;
  losses: number;
  draws: number;
};
// matrix[rowPlayer][colPlayer] = MatchupRecord
type CompatibilityMatrix = Map<string, Map<string, MatchupRecord>>;
```

---

## 画面レイアウト

```
[ヘッダー] スコア入力 | 対局履歴 | 成績集計 | 相性表 | 管理画面
─────────────────────────────────────────────────────
[DateRangeFilter] （成績集計と同一 props 構成）
─────────────────────────────────────────────────────
相性表
         | A | B | C | D |
    ─────┼───┼───┼───┼───┤
      A  | - |2勝1敗|...|...|
         |   |67%|   |   |
    ─────┼───┼───┼───┼───┤
      B  |..| - |...|...|
    ...
```

---

## 変更ファイル一覧（予定）

| ファイル | 種別 | 概要 |
|---|---|---|
| `app/compatibility/page.tsx` | 新規 | 相性表ページ（Server Component） |
| `lib/compatibility.ts` | 新規 | 相性データ算出ロジック |
| `components/app-header.tsx` | 変更 | NavTarget に "compatibility" 追加、ナビリンク追加 |
| `lib/authorization.ts` または型定義 | 変更 | NavTarget 型へ "compatibility" を追加（必要な場合） |

---

## 未解決事項

- なし（確認済み）
