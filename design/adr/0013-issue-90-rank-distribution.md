---
id: 0013
title: 成績集計に順位分布（2位・3位）表示を追加する
status: proposed
date: 2026-04-08
---

## コンテキスト

Issue #90: 「集計画面 順位割合を追加 — 1位、2位、3位を追加」。

現在の成績集計（`app/stats/page.tsx`）は `lib/stats.ts` で計算された `topCount`（1位回数）と `lastCount`（最下位回数）を利用しており、2位・3位の個別集計は行われていない。

一部のルールや3人打ち/4人打ちの混在環境では、2位/3位の頻度や割合を見ることが有用であるため、画面上で2位・3位の回数・割合を明示的に表示したい。

## 問題

- 2位・3位の回数と割合が表示されないため、順位分布の把握が困難。
- 3人打ちと4人打ちが混在するデータセットに対し、どのように2位・3位を表示するかの仕様が未定。

## 決定

1. 成績集計に `secondCount`（2位回数）および `thirdCount`（3位回数）を追加する。
   - 併せて `secondRate`、`thirdRate`（各回数 ÷ 対局数）を算出して `PlayerStats` 型に追加する。

2. 実装は `lib/stats.ts` 側で集計する。
   - 各対局の `match.playerCount` を参照し、`p.rank === 2` や `p.rank === 3` の判定でカウントする。
   - 3人打ちの対局では `thirdCount` が `lastCount` と等しくなる（3人打ち時は順位が1〜3）。

3. 表示は `app/stats/page.tsx`（および新規作成済の `components/stats-sortable-table.tsx`）で行う。
   - モバイル（カード）表示とPC（テーブル）表示の両方に対して、2位・3位の回数と割合を追加表示する。
   - PC のテーブル列はソート可能とし、`secondCount`/`thirdCount`/`secondRate`/`thirdRate` をソート対象に追加する。

4. 初期ソート・順位の取り扱い
   - 初期表示は従来どおり `totalScore`（合計）降順のままにする。
   - `rank`（総合順位）は合計得点基準で表示され、2位/3位の割合表示はそれとは独立した集計指標である。

## 実装方針（詳細）

1. 型の拡張
   - `lib/stats.ts` にある `PlayerStats` 型を拡張:
     - `secondCount: number`, `thirdCount: number`
     - `secondRate: number`, `thirdRate: number`

2. 集計ロジックの変更
   - `fetchPlayerStats` 内で、各プレイヤーの累積オブジェクトに `secondCount` / `thirdCount` を追加し、対局ループ内で `if (p.rank === 2) acc.secondCount += 1` などを行う。
   - 集計後に各率（`secondRate`, `thirdRate`）を `games > 0 ? count / games : 0` で算出する。

3. UI の変更
   - モバイルカード (`md:hidden`) 表示に 2位・3位の表示行を追加（既存の `dl` に項目を追加）。表示スペースが不足する場合は 2位・3位 を折りたたむスタイル案を検討するが、まずは単純追加で運用負荷を確認する。
   - PC テーブルには新列を追加。列順は次の案を推奨: 名前・合計・順位・対局数・トップ回数・2位回数・3位回数・ラス回数・...（その他指標）。
   - `components/stats-sortable-table.tsx` の `SortKey` に `secondCount` / `thirdCount` / `secondRate` / `thirdRate` を追加し、ヘッダーでクリック可能にする。

4. テスト/検証
   - サンプルデータで 3人打ち／4人打ち混在のケースを作成し、2位・3位の集計結果が期待通りになることを確認する。
   - `npm run build` が通ることを確認する。

## 受け入れ基準

- 3人打ちの対局が混在しているデータで、各プレイヤーに対して `secondCount` と `thirdCount` が正しく計算される。
- 成績画面（モバイルカード／PC テーブル）で 2位・3位 の回数および割合が表示される。
- PC テーブルで 2位・3位 の列がソート可能である。
- 既存の指標（トップ率、飛ばし率等）との互換性が保たれる。

## 影響範囲

- 変更: `lib/stats.ts`, `app/stats/page.tsx`, `components/stats-sortable-table.tsx`
- 追加: テストケース（推奨）

## 代替案

1. UIには表示せずCSVのみ出力する
   - 表示コストを下げられるが、即時可視化の利便性が損なわれるため不採用。

2. サーバーで任意列ソートを提供
   - 将来的な強化として有用だが、今回の要件は表示指標の追加であり、クライアント側ソートの拡張で迅速に対応可能なため今回はこちらを採用する。

## 実施ステップ（推奨）

1. `lib/stats.ts` に `secondCount` / `thirdCount` の集計ロジックと `secondRate` / `thirdRate` の算出を追加する。
2. `PlayerStats` 型を更新する。
3. `components/stats-sortable-table.tsx` を更新して列を追加し、`SortKey` を拡張する。
4. `app/stats/page.tsx` のモバイルカード側レイアウトに 2位・3位 を追加する。
5. `npm run build` → 手動で表示確認（3人打ち/4人打ち混在データ） → コミット/PR。
