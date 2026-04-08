# ADR 0015: Stats Subtables (Issue #120)

## 状況
成績集計画面に、既存のプレイヤー別集計表の下へ追加の集計表（別表）を表示したい。

要求:
- 役満リスト（いつ、誰が、何の役満をあげたか）
- 1対局単位のランキング（最高得点・最低得点）
- 必要なら最大点差ランキングなどの候補

## 決定
- 既存の対局取得ロジック（`fetchMatchResults`）を再利用して、サーバー側で集計用データを作成する。
- 集計ロジックは `lib/stats-subtables.js` に実装し、純粋関数 `computeSubtablesFromMatches(matches, topN)` を提供する。
- ラッパー `fetchStatsSubtables(start,end,topN)` を用意し、ページからはこれを呼ぶ。
- 出力は表示用に簡易な配列形式とし、UI 側で最大件数（デフォルト 20）を表示する。

## 理由
- 既存 `MatchResult` には日時・作成時刻・各プレイヤーの点数・役満情報が含まれており、追加クエリを起こさずに集計可能。
- `computeSubtablesFromMatches` を分離しておくことでユニットテストが容易になる。

## 影響範囲
- `lib/stats-subtables.js`（新規）、型宣言 `lib/stats-subtables.d.ts`（TS 対応）
- `app/stats/page.tsx` に表示ブロックを追加
- `test/stats-subtables.test.js`（ユニットテスト）

## 実装ノート
- ソート基準: 最高得点は `score desc`、最低得点は `score asc`。同点は `createdAt desc` で決着。
- 役満は `createdAt desc` で古い順・新しい順どちらでも見やすいよう新しい順を採用する。
