# Issue #132 設計: 成績集計に試合数フィルタを追加

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/132
- タイトル: 成績集計 試合数のフィルタを追加
- 要件: 成績集計画面で「試合数：20試合以上、条件なし」を選択可能にする（初期値は条件なし）

## 1. 目的

成績集計画面でプレイヤーの絞り込み条件として、対局数（games）を追加する。これにより、極端に試合数が少ないプレイヤーを除外してランキングや集計値を確認しやすくする。

## 2. 現状

- `app/stats/page.tsx` は日付フィルタパラメータを受け取り、`lib/stats.ts` の `fetchPlayerStats(start, end)` を呼び出している。
- `lib/stats.ts` はプレイヤー別成績を算出し、`games` を含む `PlayerStats[]` を返す。
- `components/date-range-filter.tsx` は日付フィルタの UI を提供し、`start` と `end` を GET パラメータとして送信する。
- `components/csv-export-button.tsx` は `start`/`end` を含む CSV エクスポート URL を生成している。
- 現状、成績集計では「試合数」による絞り込みを行っていない。

## 3. 変更方針

### 3.1 追加対象と責務

- `lib/filter-params.ts`:
  - `resolveFilterParams` に `minGames?: number` を追加し、URL パラメータを一元解析する。
  - バリデーション: 整数かつ `>= 0` であることを確認し、不正な値は無視する。
- `lib/stats.ts`:
  - `fetchPlayerStats(startDate?, endDate?, minGames?)` に `minGames` 引数を追加する。
  - 集計結果の後に `games >= minGames` で絞り込みを行う。
- `app/stats/page.tsx`:
  - `resolveFilterParams` から `minGames` を受け取って `fetchPlayerStats` に渡す。
- `app/api/export/stats/route.ts`:
  - CSV エクスポート API も `minGames` を受け取って集計に反映する。
- `components/date-range-filter.tsx`:
  - UI に `select name="minGames"` を追加し、`条件なし` と `20試合以上` を選択できるようにする。
- `components/csv-export-button.tsx`:
  - エクスポート URL に `minGames` を含める。

### 3.2 UI の仕様

- 成績集計画面のフィルタ欄に「試合数」選択を追加する。
- 選択肢:
  - `条件なし`（初期値）
  - `20試合以上`
- `select` の値は `minGames` として送信し、画面表示と CSV に共通で反映させる。
- 将来的には選択肢を拡張して `10試合以上` などの追加も可能。

### 3.3 パラメータ仕様

URL パラメータに以下を追加する:

- `minGames=20` → 試合数 20 以上で絞り込み
- `minGames` が存在しない、または空文字の場合 → 絞り込みなし

### 3.4 データフロー

1. ページを読み込み、`app/stats/page.tsx` で `resolveFilterParams(params)` を実行
2. `resolveFilterParams` が `start`, `end`, `minGames` を返す
3. `fetchPlayerStats(start, end, minGames)` で集計結果を取得
4. 取得結果をテーブルと CSV エクスポートに渡す

## 4. 実装詳細

### 4.1 `lib/filter-params.ts`

- `FilterParamResult` に `minGames?: number` を追加する。
- `resolveFilterParams` で `params.minGames` をパースし、数値で `>= 0` のときのみ返す。
- 例: `const minGamesString = config.params?.minGames;` → `Number(minGamesString)` → `Number.isInteger(value) && value >= 0`

### 4.2 `lib/stats.ts`

- 関数シグネチャを `fetchPlayerStats(startDate?: string, endDate?: string, minGames?: number)` に変更。
- 既存の集計後、`minGames` が指定されていれば `stats.filter((player) => player.games >= minGames)` を適用。
- `minGames` の指定がない場合は従来どおり全件返す。

### 4.3 `app/stats/page.tsx`

- `resolveFilterParams` の戻り値から `minGames` を受け取る。
- `fetchPlayerStats(start, end, minGames)` を呼び出す。
- `components/date-range-filter` の props に `minGames` の現在値を渡し、初期値・選択状態を維持する。

### 4.4 `app/api/export/stats/route.ts`

- `URLSearchParams` から `minGames` を読み取る。
- `fetchPlayerStats(start, end, minGames)` を呼ぶ。
- エクスポート時の結果は画面同期を保つ。

### 4.5 `components/date-range-filter.tsx`

- `select name="minGames"` を追加。
- `options`:
  - `value=""` → 条件なし
  - `value="20"` → 20試合以上
- `defaultValue` と `aria-label` を設定。
- 現在値が `20` の場合は選択状態を維持する。

### 4.6 `components/csv-export-button.tsx`

- 既存の `start`/`end` 取得ロジックに加えて、`input[name="minGames"]` を読み取る。
- `minGames` が空以外なら `params.set("minGames", value)` を追加。

## 5. 検証要件

### 5.1 動作確認

- `/stats` 画面で `条件なし` を選択したとき、全プレイヤーが表示される。
- `/stats` 画面で `20試合以上` を選択したとき、`games` が 20 未満のプレイヤーは表示されない。
- CSV 出力後のファイルに、画面と同じフィルタ条件が適用されている。

### 5.2 テスト

- `lib/stats.ts` の単体テストに `minGames` 指定時の絞り込みケースを追加する。
- `filter-params.ts` のテストに `minGames` のパースとバリデーションケースを追加する。

### 5.3 侵害確認

- `minGames` が負数、文字列、浮動小数点など不正値の場合、絞り込みを適用せず `条件なし` 扱いにする。
- `minGames` を URL で直接変更した場合も、サーバー側で正しく無効化されることを確認する。

## 6. 影響範囲

### 6.1 変更が入るファイル

- `lib/filter-params.ts`
- `lib/stats.ts`
- `app/stats/page.tsx`
- `app/api/export/stats/route.ts`
- `components/date-range-filter.tsx`
- `components/csv-export-button.tsx`

### 6.2 追加可能なテストファイル

- `test/stats-filter.test.ts` など（既存テスト構成に合わせて追加）

### 6.3 影響しないもの

- `app/matches` 側のフィルタ機能
- DB スキーマ（既存の `games` カラムを利用するため変更なし）

## 7. 実装ステップ

1. `lib/filter-params.ts` の `resolveFilterParams` を拡張して `minGames` を返す
2. `lib/stats.ts` の `fetchPlayerStats` に `minGames` パラメータを追加し絞り込みを実装
3. `app/stats/page.tsx` で `minGames` を渡す
4. `app/api/export/stats/route.ts` で CSV も反映する
5. `components/date-range-filter.tsx` に `minGames` 選択 UI を追加
6. `components/csv-export-button.tsx` に `minGames` を組み込む
7. `npm run build` とテスト実行で確認

## 8. 実装後の検証（要求仕様に基づく挙動）

以下は実装後にコードを確認・ビルドして検証した結果です。挙動は要求どおりに行われます。

- 表示条件
  - `filter` が `year`（今年）の場合: `試合数` セレクトを表示する。
  - `filter` が `custom`（任意）の場合: `試合数` セレクトを表示する。
  - `filter` が単一日付（YYYY-MM-DD）の場合: `試合数` セレクトは非表示。`minGames` は条件なし扱い（送信されない）。
  - 対局履歴画面（`app/matches/page.tsx`）では `DateRangeFilter` に `showMinGames={false}` を渡し、常に非表示にしている。

- 初期値
  - `filter` が `year` の初期状態では `minGames` の初期値は `20` に設定される（URL に `minGames` が含まれている場合はその値を優先）。
  - `filter` が `custom` の初期状態では `minGames` の初期値は空（条件なし）。
  - 単一日付のときは初期 `minGames` は空（条件なし）。

- 挙動（発動／送信）
  - `filter === 'year'` のとき: `minGames` を変更すると即時反映され、選択値（空を含む）を URL クエリへ明示的に載せて再遷移する。
  - `filter === 'custom'` のとき: `minGames` を変更しても自動送信は行わない（ユーザーは日付範囲を設定後に絞込ボタンを押す）。
  - `filter` が単一日付のとき: `minGames` は送信されない（条件なし扱い）。
  - `filter === 'year'` で `minGames` を条件なし（空）にした場合も、`minGames=` を保持して「既定値20の再適用」を防ぐ。

- CSV 出力
  - `components/csv-export-button.tsx` は `input[name="minGames"]`（hidden）を優先して読み取り、必要に応じて `select[name="minGames"]` も参照する。したがって画面上で `minGames` が表示されている（`year`/`custom`）場合、CSV にも同じフィルタが反映される。単一日付や対局履歴ページでは `minGames` は含まれない。

- 実施結果
  - ビルド: `npm run build` を実行し成功を確認済み（ESLint 警告は非 blocking）。
  - 変更ファイル一覧（主なもの）:
    - `components/date-range-filter.tsx` — 表示条件・自動送信ロジック・初期値を実装
    - `app/matches/page.tsx` — `showMinGames={false}` を渡して非表示に設定
    - `lib/filter-params.ts`, `lib/stats.ts`, `app/stats/page.tsx`, `app/api/export/stats/route.ts`, `components/csv-export-button.tsx` — 既存の `minGames` 連携を実装

## 9. 補足

- 今回は Issue 要件に合わせて `20試合以上 / 条件なし` の固定選択に留める。
- 将来的には `10試合以上` や任意値入力への拡張を検討できる。
- パフォーマンス要件が上がる場合は、現在のアプリ側絞り込みを SQL 側に移行する検討が必要になる。