---
title: Issue-214 — 飛び・焼き鳥の昇順ランキングに順位バッジを追加
owner: @copilot
created: 2026-05-04
status: Draft
related_issues:
  - 214
---

背景
--
成績集計表では `computeTopSets` により「多いほど良い」指標（tobashiRate、topRate 等）には順位バッジが表示される。
しかし `tobiCount`（飛び回数）と `yakitoriCount`（焼き鳥回数）は「少ないほど良い」指標であるため、
`METRIC_DIRECTION` に定義されておらず、`computeTopSets` の対象外になっている。
その結果、これら2列にはバッジが表示されない。

目的
--
`tobiCount` と `yakitoriCount` を昇順（小さいほど上位）評価指標として `METRIC_DIRECTION` に追加し、
成績集計表の該当列に順位バッジを表示する。

受け入れ条件
--
- 飛び列（`tobiCount`）で順位バッジ（1〜3位）が表示される
- 焼き鳥列（`yakitoriCount`）で順位バッジ（1〜3位）が表示される
- 並び順とバッジ順位が一致する（昇順: 数値が小さいプレイヤーが1位）
- 同率時は Excel RANK 方式（1,1,3...）に準拠する（既存 `computeTopSets` の挙動を流用）
- 既存の他指標バッジに影響が出ない

影響範囲
--
- `lib/metric-ranks.js`: `METRIC_DIRECTION` に `tobiCount: "asc"`・`yakitoriCount: "asc"` を追加
- `components/stats-sortable-table.tsx`: `getCellHighlight("tobiCount", ...)` / `getCellHighlight("yakitoriCount", ...)` の呼び出しを追加（現在は素の数値表示）

制約
--
- `computeTopSets` のロジック自体は変更しない（"asc" 方向は既にサポート済み）
- `METRICS_TO_HIGHLIGHT` は `Object.keys(METRIC_DIRECTION)` の自動導出なので個別変更不要
- PDF 出力（#215）は別 Issue で対応

テスト
--
- ユニット: `npm test`（既存の metric-ranks テストが通ること）
- E2E: `npm run build` 確認、手動: 飛び・焼き鳥列のバッジ表示を目視確認

参考
--
- `lib/metric-ranks.js`: `METRIC_DIRECTION` の既存定義（lastCount: "asc" が参考例）
- `components/stats-sortable-table.tsx`: `getCellHighlight` / `METRIC_BADGE_CLS` の既存使用箇所

実装方針
--
1. `lib/metric-ranks.js` の `METRIC_DIRECTION` に2行追加:
   ```js
   tobiCount: "asc",
   yakitoriCount: "asc",
   ```
2. `components/stats-sortable-table.tsx` の飛び・焼き鳥セルに `getCellHighlight` を適用する。
   現在の実装例（lastCount など）を参照してパターン化する。
