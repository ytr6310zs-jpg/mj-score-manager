# Implementation Plan: Issue #328

**合意クラス**: B

## 方針

1. **minGames 明示空の保持**  
   - `FilterStateSync`: `params.has("minGames")` のときは stored にフォールバックしない  
   - `buildSharedFilterSearchParams`: `includeMinGames` かつ `minGames === ""` のとき `minGames=` を付与し、サーバの year デフォルト 20 を避ける  
   - `.ts` / テスト用 `.js` を同期更新

2. **空状態文言**  
   - `app/stats/page.tsx`: `effectiveMinGames` あり／`availableDates` ありならフィルタ・期間メッセージ。真の空は取り込み案内  
   - `app/compatibility/page.tsx`: 同様にフィルタ由来を示唆

3. **テスト**  
   - `test/filter-state-preference.test.js` に空 minGames の build ケースを追加

## 対象ファイル

- `components/filter-state-sync.tsx`
- `lib/filter-state-preference.ts` / `.js`
- `app/stats/page.tsx`
- `app/compatibility/page.tsx`
- `test/filter-state-preference.test.js`
- `.specify/specs/issue-328-stats-empty-min-games/*`
- `.specify/feature.json`

## 非スコープ

- #130 性能、スコア入力 UI、デフォルト 20 の廃止（year 未指定時のデフォルトは維持）
