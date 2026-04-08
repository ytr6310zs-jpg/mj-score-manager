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

### 3.2 画面/API層（再設計）

`app/matches/page.tsx` で開催日候補を取得し、フィルタUIへ渡す。

- ページロード時に `fetchMatchDates()` を実行
- 候補を `DateRangeFilter` の新規propsで受け渡し
- セレクトで選択した値（`filter` パラメータ）を処理:
  - `filter=year` → 当年を `start/end` にセット
  - `filter=YYYY-MM-DD` → その日付を `start=end` にセット
  - `filter=custom` → 手入力の `start/end` を使用

実装案:
- 追加props(案):
  - `availableDates?: string[]`
  - `selectedFilter?: 'year' | 'YYYY-MM-DD' | 'custom'`
- `selectedFilter` に応じて、セレクト状態と入力欄の表示/非表示を制御

### 3.3 フィルタUI（再設計）

`components/date-range-filter.tsx` をリデザインする。

**主UIは単一セレクト「開催日」に統一：**

```
[開催日: ▼ 今年▼]  ← セレクト
```

セレクト選択肢:
1. `今年` ... 現在年（例: 2026-01-01〜2026-12-31）
2. `実在する開催日1` (YYYY-MM-DD)
3. `実在する開催日2` ...
4. `任意` ... カスタム日付入力へ切替

**動作:**

- 選択肢 1〜3 を選ぶ → 即座に `start/end` をセット、フォーム送信
- `任意` を選ぶ → `start/end` の手入力欄を表示（従来の `mode="range"` と同じUI）
- 候補が空の場合 → セレクトは非表示、手入力だけで動作可能にする

**廃止対象:**
- `当日` オプション（実在日が開催日選択肢に含まれるため不要）
- `mode` の概念（単一セレクト化で不要）

### 3.4 URLパラメータ仕様（再設計）

**新規クエリキー `filter` を導入:**

```
/matches?filter=year           → 今年を表示
/matches?filter=2026-04-01     → 2026-04-01 のみ表示
/matches?filter=custom&start=2026-01-01&end=2026-12-31  → カスタム範囲
```

**既存 URL との互換:**

当面は既存の `mode/start/end` も受け付け、内部で新形式に変換する（段階的なマイグレーション）。

- `?mode=thisYear` → `filter=year` に読替
- `?mode=today` → 廃止（対応する `filter` 値なし）
- `?mode=range&start=X&end=Y` → `filter=custom&start=X&end=Y` に読替

ページロード時の優先順位:
1. `filter` パラメータがあれば、それを優先
2. 古い `mode/start/end` があれば、新形式に変換
3. いずれもなければ、デフォルト `filter=year`

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

## 6. テスト観点（再設計版）

1. 開催日セレクトに「今年」「実在日」「任意」が正しく表示される
2. 「今年」を選ぶと、年初〜年末の対局が表示される
3. 実在する開催日を選ぶと、その日の対局のみ表示される
4. 「任意」を選ぶと、`start/end` 手入力欄が表示される
5. 手入力で日付範囲を指定して送信すると、該当対局が表示される
6. 候補取得失敗時でも、セレクトなしで手入力絞込みは利用できる
7. 既存URL（`?mode=thisYear` など）でもアクセス可能（互換性確認）

## 7. 実装ステップ

1. `lib/matches.ts` の `fetchMatchDates` を確認（既実装）
2. `components/date-range-filter.tsx` を新セレクト構造に全体リデザイン
3. `app/matches/page.tsx` で URL パラメータ解析を新仕様に対応
4. 手動確認 + `npm run build` で回帰確認
5. 既存 URL（`?mode=thisYear` など）でのアクセス動作確認
