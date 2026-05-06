---
title: Issue-215 — PDF出力に順位色付けを追加（成績集計画面準拠）
owner: @copilot
created: 2026-05-04
status: Draft
related_issues:
  - 215
---

背景
--
PDF出力（`/stats/print`）の成績集計テーブル（`StatsSummaryTable`）の順位列は
現在プレーンテキスト（`{p.rank}`）で表示されており、色付けがない。
成績集計画面では `RANK_BADGE` を使った色付きバッジが表示されており、PDF との乖離がある。

目的
--
PDF出力の順位列に成績集計画面と同じ `RANK_BADGE` スタイルを適用し、
視認性と画面との一貫性を向上させる。

受け入れ条件
--
- PDF（`/stats/print`）の順位列に順位バッジが表示される
- 画面表示（`RANK_BADGE`）と色ルールが一致する（1位: 黄、2位: グレー、3位: オレンジ）
- 4位以降は現在のプレーンテキストを維持
- 可読性が保たれている（白黒印刷時もテキストが判読できる）

影響範囲
--
- `components/stats-print/StatsSummaryTable.tsx`: 順位 `<td>` に条件付き RANK_BADGE スタイルを適用

制約
--
- バッジは 1〜3 位のみ（`RANK_BADGE` の既存定義に準拠）
- `RANK_BADGE` 定義自体は変更しない（`lib/stats-rank-theme.ts` は読み取り専用）
- `topSets`（指標ランキング）の PDF への反映は今回の対象外
- 印刷用スタイル（`@media print`）の新規追加は行わない

テスト
--
- ユニット: 対象なし（JSX の条件分岐のみ）
- E2E: `npm run build` 確認、手動: `/stats/print` で1〜3位の順位バッジを目視確認

参考
--
- `lib/stats-rank-theme.ts`: `RANK_BADGE` / `RANK_ROW_BG` の定義
- `components/stats-sortable-table.tsx`: 既存の順位バッジ実装例（`badgeCls` / `RANK_BADGE[player.rank]`）
- `app/stats/print/client.tsx`: `StatsSummaryTable` の呼び出し元

実装方針
--
`components/stats-print/StatsSummaryTable.tsx` の順位 `<td>` を以下のように変更する:

変更前:
```tsx
<td className="px-2 py-0 text-center align-middle leading-4">{p.rank}</td>
```

変更後（1〜3位にバッジ付与、4位以降はプレーン）:
```tsx
<td className="px-2 py-0 text-center align-middle leading-4">
  {RANK_BADGE[p.rank] ? (
    <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-[10px] font-bold ${RANK_BADGE[p.rank]}`}>
      {p.rank}
    </span>
  ) : (
    p.rank
  )}
</td>
```
