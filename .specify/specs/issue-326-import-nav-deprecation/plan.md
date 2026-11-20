# Implementation Plan: Issue #326

**合意クラス**: B

## 方針

1. `一括インポート（PoC）` → `一括取り込み`（matches CTA）
2. import CardTitle から PoC を除去（例: `スプレッドシートから取り込み`）
3. `AppHeader`: 編集権限時に「一括取り込み」を主ナビへ。スコア入力はアカウントメニューの「スコア入力（非推奨）」へ
4. import ページの `current` を `import` に
5. `filter-state-e2e` はスコア入力クリック依存をやめ、別画面経由に変更

## 対象

- `components/app-header.tsx`
- `components/match-import-form.tsx`
- `app/matches/page.tsx`
- `app/matches/import/page.tsx`
- `test/e2e/ui/filter-state-e2e.spec.ts`
- Spec / `feature.json`
