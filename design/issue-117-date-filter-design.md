# Issue #117 設計: 対局履歴を対局日で絞込み

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/117
- タイトル: 対局履歴 対局日で絞込み
- 要件メモ: 開催日をDBから取得して選択可能

## 1. 目的

対局履歴画面で、DBに存在する開催日 (`games.date`) を選択して絞込みできるようにする。

## 2. 現状

- `app/matches/page.tsx` は `DateRangeFilter` を使い、`mode=today|thisYear|range` と `start/end` の手入力で絞込みしている。
- `lib/matches.ts` の `fetchMatchResults(startDate, endDate)` は `games.date` に対して `gte/lte` を適用して取得している。
- 開催日一覧を返すAPIは存在しない。

## 3. 変更方針

### 3.1 データ取得層

`lib/matches.ts` に開催日一覧取得関数を追加する。

- 追加関数(案): `fetchMatchDates(): Promise<{ dates: string[]; error: string | null }>`
- 取得元: `games.date`
- 並び順: 降順(新しい日付を先頭)
- 返却形式: `YYYY-MM-DD` 文字列配列
- エラー時: 既存実装と同様に `error` 文字列を返す

備考:
- 現状の`fetchMatchResults`は維持し、既存URLパラメータ仕様(`mode/start/end`)を壊さない。

### 3.2 画面/API層

`app/matches/page.tsx` で開催日候補を取得し、フィルタUIへ渡す。

- ページロード時に `fetchMatchDates()` を実行
- 候補を `DateRangeFilter` の新規propsで受け渡し
- `mode="range"` の場合、既存の入力欄に加え「開催日選択」UIを追加

実装案:
- 追加props(案):
  - `availableDates?: string[]`
  - `selectedDate?: string`
- `selectedDate` が指定された場合、`start/end` を同日にセットして送信する

### 3.3 フィルタUI

`components/date-range-filter.tsx` を拡張する。

- `mode="range"` 時に、`<select>` で `availableDates` を表示
- 選択時の動作:
  - 開催日を選ぶと `start=end=選択日` に同期
  - 手入力の日付欄は残す(既存互換)
- 候補が空の場合:
  - 現行の手入力だけで動作可能にする

UIラベル案:
- `開催日` (placeholder: `選択してください`)

### 3.4 URLパラメータ互換

新規クエリキーは増やさず、既存の `start/end/mode` に統一する。

- 理由: CSVエクスポートや他画面(統計)の連携を壊さないため
- 共有URLの挙動を保ち、後方互換を確保

## 4. バリデーションとエラーハンドリング

- `fetchMatchDates` で日付のnull/不正値を除外
- UIでは `start > end` の既存チェックを維持
- 開催日一覧取得失敗時は:
  - セレクトを非表示または無効化
  - 既存の手入力絞込みは継続可能にする

## 5. 影響範囲

- 変更対象(想定):
  - `lib/matches.ts`
  - `app/matches/page.tsx`
  - `components/date-range-filter.tsx`
- 非対象:
  - `app/stats/page.tsx` (今回はIssue文面上、対局履歴のみ)
  - DBマイグレーション (既存の `games.date` を利用)

## 6. テスト観点

1. 開催日セレクトにDBの日付が降順で表示される
2. 開催日を選択して送信すると、当該日の対局のみ表示される
3. 開催日未選択時は既存の手入力レンジ絞込みが機能する
4. 候補取得失敗時でも画面が壊れず、手入力絞込みは利用できる
5. 既存の `today/thisYear/range` モード挙動が維持される

## 7. 実装ステップ

1. `lib/matches.ts` に `fetchMatchDates` を追加
2. `app/matches/page.tsx` で `fetchMatchDates` を呼び出し、`DateRangeFilter` へ渡す
3. `components/date-range-filter.tsx` に開催日セレクトを追加
4. 手動確認 + `npm run build` で回帰確認
