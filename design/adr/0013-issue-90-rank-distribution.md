---
id: 0013
title: 成績集計に順位分布（2位・3位）表示を追加する
status: proposed
date: 2026-04-08
---

## コンテキスト

Issue #90: 「集計画面 順位割合を追加 — 1位、2位、3位を追加」。

現在の成績集計（`app/stats/page.tsx`）は `lib/stats.ts` で計算された `topRate`（1位割合）を持つ一方で、2位・3位の割合は算出していない。

一部のルールや3人打ち/4人打ちの混在環境では、2位/3位の割合を見ることが有用であるため、画面とCSVで1位・2位・3位の割合を明示的に表示したい。

## 問題

- 2位・3位の割合が表示されないため、順位分布の把握が困難。
- 3人打ちと4人打ちが混在するデータセットに対し、どのように2位・3位を表示するかの仕様が未定。
- 成績CSVに順位割合（1位/2位/3位）を含めるかが未定。

## 決定

1. 順位分布は「割合のみ」を表示する。
   - 1位割合は既存の `topRate` を利用する。
   - 2位割合 `secondRate`、3位割合 `thirdRate`（各回数 ÷ 対局数）を `PlayerStats` 型に追加する。

2. 実装は `lib/stats.ts` 側で集計する。
   - 各対局の `match.playerCount` を参照し、`p.rank === 2` や `p.rank === 3` の判定で割合計算用にカウントする。
   - 3人打ちの対局では `thirdRate` が `lastCount` ベースの割合と等しくなる（3人打ち時は順位が1〜3）。

3. 表示は `app/stats/page.tsx`（および新規作成済の `components/stats-sortable-table.tsx`）で行う。
   - モバイル（カード）表示とPC（テーブル）表示の両方に対して、1位・2位・3位の割合を表示する。
   - モバイルでは省略せず、PCと同じく3指標を表示する。
   - PC のテーブル列はソート可能とし、`topRate`/`secondRate`/`thirdRate` をソート対象に含める。

4. 成績CSVにも順位割合列を追加する。
   - `app/api/export/stats/route.ts` のヘッダと行データに `secondRate` / `thirdRate` を追加する。
   - 既存の `topRate` と合わせて 1位/2位/3位 の割合をCSVで取得可能にする。

5. 初期ソート・順位の取り扱い
   - 初期表示は従来どおり `totalScore`（合計）降順のままにする。
   - `rank`（総合順位）は合計得点基準で表示され、2位/3位の割合表示はそれとは独立した集計指標である。

## 実装方針（詳細）

1. 型の拡張
   - `lib/stats.ts` にある `PlayerStats` 型を拡張:
   - `secondRate: number`, `thirdRate: number`

2. 集計ロジックの変更
   - `fetchPlayerStats` 内で、各プレイヤーの累積オブジェクトに割合算出用の `secondCount` / `thirdCount` を追加し、対局ループ内で `if (p.rank === 2) ...` などを行う。
   - 集計後に各率（`secondRate`, `thirdRate`）を `games > 0 ? count / games : 0` で算出する。
   - 1位割合は既存の `topRate` をそのまま利用する。

3. UI の変更
   - モバイルカード (`md:hidden`) 表示に 1位・2位・3位割合の表示行を追加する（省略しない）。
   - PC テーブルには `1位割合`（既存 topRate）・`2位割合`・`3位割合` の列を追加する。
   - `components/stats-sortable-table.tsx` の `SortKey` に `secondRate` / `thirdRate` を追加し、`topRate` と同様にヘッダーでクリック可能にする。

4. CSV の変更
   - `app/api/export/stats/route.ts` のCSVヘッダへ `secondRate`, `thirdRate` を追加する。
   - 行データにも同値を追加し、既存 `topRate` と合わせて順位割合セットを出力する。

5. テスト/検証
   - サンプルデータで 3人打ち／4人打ち混在のケースを作成し、1位・2位・3位割合の集計結果が期待通りになることを確認する。
   - `npm run build` が通ることを確認する。

## 受け入れ基準

- 3人打ちの対局が混在しているデータで、各プレイヤーに対して `secondRate` と `thirdRate` が正しく計算される。
- 成績画面（モバイルカード／PC テーブル）で 1位（既存）・2位・3位の割合が表示される。
- PC テーブルで 1位・2位・3位割合の列がソート可能である。
- 成績CSVに `topRate`, `secondRate`, `thirdRate` が出力される。
- 既存の指標（トップ率、飛ばし率等）との互換性が保たれる。

## 影響範囲

- 変更: `lib/stats.ts`, `app/stats/page.tsx`, `components/stats-sortable-table.tsx`, `app/api/export/stats/route.ts`
- 追加: テストケース（推奨）

## 代替案

1. UIには表示せずCSVのみ出力する
   - 表示コストを下げられるが、即時可視化の利便性が損なわれるため不採用。

2. サーバーで任意列ソートを提供
   - 将来的な強化として有用だが、今回の要件は表示指標の追加であり、クライアント側ソートの拡張で迅速に対応可能なため今回はこちらを採用する。

## 実施ステップ（推奨）

1. `lib/stats.ts` に `secondRate` / `thirdRate` の算出を追加する（1位は既存 `topRate` を利用）。
2. `PlayerStats` 型を更新する。
3. `components/stats-sortable-table.tsx` を更新して 1位/2位/3位割合列を表示し、`SortKey` を拡張する。
4. `app/stats/page.tsx` のモバイルカード側レイアウトに 1位/2位/3位割合を追加する（省略なし）。
5. `app/api/export/stats/route.ts` のCSVヘッダと行データに `secondRate` / `thirdRate` を追加する。
6. `npm run build` → 手動で表示確認（3人打ち/4人打ち混在データ） → コミット/PR。
