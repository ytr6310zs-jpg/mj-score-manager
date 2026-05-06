---
title: Issue-213 — 成績集計画面のヘッダー固定
owner: @copilot
created: 2026-05-04
status: Implemented
related_issues:
  - 213
---

背景
--
成績集計表のスクロール時にヘッダーが追従せず、列の視認性が落ちる。
プレイヤー数が多い場合、縦スクロールで列見出しが画面外へ消えてしまう。

目的
--
成績集計テーブルで縦スクロール中も列見出しを常時視認できるようにし、指標の読み取り性を向上させる。

受け入れ条件
--
- スクロール中もヘッダー行が視認できる
- 列幅ずれや重なりが起きない
- スマホ表示で操作性が著しく悪化しない

影響範囲
--
- `app/stats/page.tsx`: テーブルラッパーの overflow 設定変更
- `components/stats-sortable-table.tsx`: thead の各 th に sticky を付与

制約
--
- モバイルカード表示（`md:hidden`）は対象外
- 統計計算ロジック・PDF出力は変更しない

テスト
--
- ユニット: 対象なし（CSS クラス変更のみ）
- E2E: ビルド確認（`npm run build`）、手動目視確認

参考
--
- `lib/stats-rank-theme.ts`: RANK_BADGE 定義
- 既存の先頭列 sticky 実装（`sticky left-0 z-10`）

実装メモ
--
- `app/stats/page.tsx`: `overflow-x-auto` → `overflow-auto max-h-[70vh]`
- `components/stats-sortable-table.tsx` header() ヘルパー `<th>`: `sticky top-0 z-20 bg-emerald-50` 付与（不透明）
- 名前列 `<th>`: `sticky left-0 z-10` → `sticky left-0 top-0 z-30 bg-emerald-50`（不透明）
- PR: #222
