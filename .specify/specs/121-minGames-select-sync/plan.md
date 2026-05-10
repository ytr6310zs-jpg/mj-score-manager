# Issue #121 補完 実装計画

**Branch**: `fix/compatibility-minGames-select-sync` | **Date**: 2026-05-10  
**Spec**: [spec.md](spec.md) | **Tasks**: [tasks.md](tasks.md)  
**Issue**: #121 補完  

---

## 実装方針

### 修正アプローチ
シンプルな 1 行修正で解決。`page.tsx` の `initialMinGames` 計算ロジックを改善して、  
URL パラメータの有無を区別し、空文字を `DateRangeFilter` に明示的に渡す。

### 修正箇所の詳細

#### ファイル: `app/compatibility/page.tsx`

**修正対象行** (約 151 行目付近)：
```typescript
initialMinGames={effectiveMinGames !== undefined ? String(effectiveMinGames) : undefined}
```

**修正内容**:  
成績集計ページと同じアプローチ：
```typescript
initialMinGames={
  initialMinGamesRaw !== undefined
    ? initialMinGamesRaw
    : filter === "year"
      ? "20"
      : ""
}
```

### 修正の仕組み（成績集計ページと同一）

| URL パラメータ | initialMinGamesRaw | filter | initialMinGames | セレクト表示 |
|--|--|--|--|--|
| なし | undefined | "year" | "20" | 「20試合以上」(デフォルト) |
| `minGames=` (空文字) | "" | "year" | "" | 「条件なし」 ✓ 修正で解決 |
| `minGames=20` | "20" | "year" | "20" | 「20試合以上」 |
| なし | undefined | "custom" | "" | 「条件なし」 |

**重要**: `initialMinGamesRaw` は `resolveFilterParams` の外で、URL パラメータから直接取得した値。  
空文字も失われずに保持されるため、`DateRangeFilter` が正しく同期できる。

---

## 検証計画

### 手動テストシナリオ

#### シナリオ 1: 「条件なし」を選択
1. ブラウザで相性表ページを開く
2. フィルタが「今年」であることを確認
3. 試合数セレクトを「条件なし」に変更
4. **確認**: テーブルが「条件なし」で更新され、セレクトも「条件なし」のままか？
5. **確認**: F5 リロード後、セレクトが「条件なし」のままか？

#### シナリオ 2: 「20試合以上」に戻す
1. シナリオ 1 の状態から、試合数セレクトを「20試合以上」に変更
2. **確認**: テーブルが「20試合以上」でフィルタされ、セレクトも「20試合以上」か？
3. **確認**: F5 リロード後も「20試合以上」か？

#### シナリオ 3: デフォルト状態
1. URL から `minGames` パラメータを削除して開く（例: `/compatibility?filter=year`）
2. **確認**: セレクトが自動的に「20試合以上」になるか？

### 自動テスト検討
- 既存の相性表テストが影響を受けないことを確認
- 同様のフィルタを使う他ページ（成績集計）も動作確認

---

## 実装ステップ

1. **修正を実装** → `app/compatibility/page.tsx` を編集
2. **ビルド確認** → `npm run build` で成功を確認
3. **手動テスト** → 上記シナリオで動作確認
4. **コミット** → 修正内容を記録
5. **Push** → ブランチをリモートに送信
6. **PR 作成** → develop ブランチへの PR を作成

---

## デプロイメント考慮事項

- **ダウンタイム**: なし
- **DB マイグレーション**: なし
- **依存関係の変更**: なし
- **機密情報**: なし

---
