# Issue #121 補完：相性表の試合数フィルタセレクト同期バグ修正

**Issue**: #121 補完  
**Feature Branch**: `fix/compatibility-minGames-select-sync`  
**Status**: 設計フェーズ  

---

## 1. 問題定義

### 現象
相性表画面で以下の操作を行うと、UI の表示状態とデータ取得の状態が不一致になる：

1. 「今年」フィルタを選択
2. 「試合数：条件なし」を選択
3. 相性表の内容は正しく「条件なし」で更新される
4. **しかし** 試合数セレクトが「20試合以上」のままになっている

### 期待動作
- 相性表の内容が「条件なし」で更新されるとき、試合数セレクトも「条件なし」が選択された状態であること

---

## 2. 根本原因

### コードフロー分析

**1. 初期表示時（「今年」フィルタで読み込み）**
- `page.tsx` の `effectiveMinGames` 計算：
  ```typescript
  const effectiveMinGames =
    typeof minGames === "number" ? minGames
    : !hasMinGamesParam && filter === "year" ? 20  // ← URL パラメータなしで、デフォルト 20 を設定
    : undefined;
  ```
- `DateRangeFilter` に `initialMinGames="20"` を渡す

**2. ユーザーが「試合数：条件なし」を選択**
- URL が `/compatibility?filter=year&minGames=` に変更（空文字を送信）

**3. ページ再読み込み時**
- `initialMinGamesRaw = ""` (URL パラメータから取得)
- `hasMinGamesParam = true` (非 undefined だから)
- `resolveFilterParams` で `minGames = undefined` に変換（空文字は無視される）
- `effectiveMinGames` 計算：
  ```typescript
  const effectiveMinGames =
    typeof minGames === "number" ? minGames       // ✗ false（minGames は undefined）
    : !hasMinGamesParam && filter === "year" ? 20 // ✗ false（hasMinGamesParam が true）
    : undefined;  // ✓ この分岐で undefined になる
  ```
- `DateRangeFilter` に `initialMinGames={undefined}` を渡す

**4. DateRangeFilter の初期化**
- `setMinGames(initialMinGames ?? defaultMin)`
- `defaultMin = getDefaultMinGamesForFilter("year")` → `"20"` を返す
- セレクト要素が「20試合以上」になる ← **バグ**

### 根本原因
`initialMinGames={undefined}` が渡される場合、`DateRangeFilter` はそれを「初期値が指定されていない」と解釈し、  
デフォルト値 `"20"` を適用してしまう。実際には、ユーザーが「条件なし」を明示的に選択したという情報が失われている。

---

## 3. 修正方針

### 修正内容
成績集計ページ（`app/stats/page.tsx`）の正しい実装に倣い、相性表ページでも **`initialMinGamesRaw` を直接活用** して、  
`effectiveMinGames` ではなく URL パラメータの有無を判定する。

### 成績集計ページとの比較

**成績集計ページ（正しく動作）**:
```typescript
const initialMinGames =
  initialMinGamesRaw !== undefined
    ? initialMinGamesRaw
    : filter === "year"
      ? "20"
      : "";
```

**相性表ページ現在（バグあり）**:
```typescript
initialMinGames={effectiveMinGames !== undefined ? String(effectiveMinGames) : undefined}
```

### 修正個所
**ファイル**: `app/compatibility/page.tsx`（約 151 行目）

**修正内容**:  
成績集計ページと同じアプローチで、`initialMinGamesRaw` の有無で判定する。

```typescript
// 修正前
initialMinGames={effectiveMinGames !== undefined ? String(effectiveMinGames) : undefined}

// 修正後
initialMinGames={
  initialMinGamesRaw !== undefined
    ? initialMinGamesRaw
    : filter === "year"
      ? "20"
      : ""
}
```

### ロジック説明
- **URL パラメータがある場合** (`initialMinGamesRaw !== undefined`)
  - `minGames=20` → 「20試合以上」を渡す
  - `minGames=` (空文字) → 「条件なし」を渡す ← **ここがポイント**
- **URL パラメータがない場合** (`initialMinGamesRaw === undefined`)
  - filter が "year" → デフォルト値 `"20"` を設定
  - その他のフィルタ → 空文字 `""` を設定

### 修正が効く理由
`effectiveMinGames` は `resolveFilterParams` で変換済み（空文字は `undefined` になる）だが、  
`initialMinGamesRaw` は URL パラメータから直接取得した元の値なので、空文字も保持される。  
これにより、ユーザーが「条件なし」を選択した時の `minGames=""` が `DateRangeFilter` に正しく渡される。

---

## 4. 影響範囲

### 影響を受けるファイル
- `app/compatibility/page.tsx` （修正対象）

### 他の相関ファイル（確認対象）
- `components/date-range-filter.tsx` （動作確認）
- `components/date-range-filter-rules.ts` （デフォルト値ロジック確認）
- `lib/filter-params.ts` （パラメータ解析ロジック確認）

### UI/UX への影響
- 相性表フィルタのセレクト表示が正しく同期される
- データ取得と表示の一貫性が改善される

---

## 5. リスク評価

### 低リスク
- 修正範囲が限定的（1 ファイルの 1 行）
- UI/UX に大きな変化なし
- 既存データに影響なし

### 検証対象
- 相性表フィルタの全パターン動作確認
- 他ページの同様フィルタ（成績集計）への影響確認

---
