# Issue #158 設計: 成績集計画面 最高得点ランキング・最低失点ランキングの修正

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/158
- タイトル: 成績集計画面 最高得点ランキング・最低失点ランキングの修正
- 要件: 最高得点ランキングと最低失点ランキングを、各プレーヤーごとの集計範囲内の代表値（最大値/最小値）で算出する方式へ統一し、フィルタ（対象期間・試合数）条件に従って表示する。別表および PDF 出力にも同一仕様を反映する。

## 1. 目的

現行の最高得点ランキング/最低得点ランキングは「全プレーヤーの全スコア明細」をそのまま並べるため、同一プレーヤーが複数行を占有しやすい。Issue #158 ではランキングの単位を各プレーヤーに統一し、期間内の代表値で比較できるようにする。

1. 最低失点ランキング: 各プレーヤーの期間内最小スコアを比較し、失点が少ない順で並べる。
2. 最高得点ランキング: 各プレーヤーの期間内最大スコアを比較し、高得点順で並べる。

## 2. 現状

- 成績集計画面は [app/stats/page.tsx](app/stats/page.tsx) で別表を表示している。
- PDF 出力は [app/stats/print/page.tsx](app/stats/print/page.tsx) と [app/stats/print/client.tsx](app/stats/print/client.tsx) で別表を表示している。
- 別表のデータ生成は [lib/stats-subtables.js](lib/stats-subtables.js) の `computeSubtablesFromMatches` を利用している。
- 現行の `highestScores` / `lowestScores` はプレーヤー単位ではなく、対局明細単位で行を作成している。

このため、ユーザー要望である「各プレーヤーごとの集計範囲ランキング」と一致しない。

## 3. 要件整理

Issue #158 の更新要望より、以下を必須要件とする。

1. 集計単位は「各プレーヤーごと」とする。
2. 最低失点ランキングは、各プレーヤーの集計範囲内 `min(score)` を採用する。
3. 最高得点ランキングは、各プレーヤーの集計範囲内 `max(score)` を採用する。
4. 並び順:
   - 最低失点ランキング: `min(score)` 降順（値が高いほど上位）
   - 最高得点ランキング: `max(score)` 降順（値が高いほど上位）
5. 表示件数は 5 件固定ではなく、対象となるプレーヤー全員を表示する。
6. 別表の表タイトルは「最高得点ランキング」「最低失点ランキング」に統一する。
7. 試合数条件 `minGames` は、プレーヤーをランキング対象に含めるかどうかの判定に使用する。
8. 適用範囲は成績集計画面の別表と PDF 出力の別表の両方とする。

補足（同値時の扱い）:

1. 同値のときは `createdAt` 降順（新しい達成記録を優先）で並べる。
2. さらに同一なら `playerName` 昇順で安定化する。

## 4. 設計方針

## 4.1 データモデル

既存の `ScoreRank` を継続利用する。

- `date`: 代表値を達成した対局日
- `createdAt`: 代表値を達成した対局作成日時
- `playerName`: プレーヤー名
- `score`: 代表値（最高値または最小値）
- `gameId`, `gameType`: 代表値の根拠対局

同一プレーヤーで代表値を複数回達成している場合は、`createdAt` が新しい対局を採用する。

## 4.2 集計アルゴリズム（採用）

`computeSubtablesFromMatches(matches, options)` の `highestScores` と `lowestScores` 生成をプレーヤー単位へ変更する。

`options` 案:

- `eligiblePlayers?: Set<string>`

処理手順:

1. 全対局を走査して、プレーヤーごとに以下を保持する。
   - `maxScoreEntry`（スコア最大の対局情報）
   - `minScoreEntry`（スコア最小の対局情報）
2. 同一値更新時は `createdAt` の新しい対局を優先して代表エントリを置換する。
3. `eligiblePlayers` 指定時は、その集合に含まれるプレーヤーのみを最終候補に残す。
4. `highestScores` は `maxScoreEntry` 群を `score desc, createdAt desc, playerName asc` でソートし、対象プレーヤー全員を返す。
5. `lowestScores` は `minScoreEntry` 群を `score desc, createdAt desc, playerName asc` でソートし、対象プレーヤー全員を返す。

## 4.3 サービス層インタフェース

`fetchStatsSubtables(startDate, endDate)` を以下に拡張する。

- `fetchStatsSubtables(startDate?, endDate?, options?: { minGames?: number })`

内部で以下を実施する。

1. 対象期間の `matches` 取得（既存）。
2. `options.minGames` がある場合、同期間内のプレーヤー対局数を算出。
3. 対局数 `>= minGames` のプレーヤー集合を `eligiblePlayers` として作成。
4. `computeSubtablesFromMatches` へ `eligiblePlayers` を渡す。

## 4.4 画面/PDF 適用

- 成績集計画面: [app/stats/page.tsx](app/stats/page.tsx)
   - `fetchStatsSubtables(start, end, { minGames: effectiveMinGames })` を呼び出す。
  - 見出し文言は現行のまま維持する。

- PDF（フィルタ準拠）: [app/stats/print/page.tsx](app/stats/print/page.tsx)
   - フィルタ条件で `minGames` を引き継いで `fetchStatsSubtables` を呼び出す。

- PDF（今年・20試合以上）: [app/stats/print/page.tsx](app/stats/print/page.tsx)
   - `yearStart/yearEnd + minGames=20` 条件で `fetchStatsSubtables` を呼び出す。

## 4.5 非採用案

1. 非採用: 明細単位のままにして同一プレーヤー重複を許容
   - 理由: ユーザー要望の「各プレーヤーごと」と矛盾する。
2. 非採用: 別表専用の新 API を追加
   - 理由: 最小差分で既存の `fetchStatsSubtables` を拡張する方が保守性が高い。

## 5. 実装対象ファイル（想定）

1. 変更: [lib/stats-subtables.js](lib/stats-subtables.js)
   - `highestScores` / `lowestScores` をプレーヤー単位ロジックへ変更
   - `options` 受け取り追加
2. 変更: [lib/stats-subtables.d.ts](lib/stats-subtables.d.ts)
   - 関数シグネチャ更新
3. 変更: [app/stats/page.tsx](app/stats/page.tsx)
   - `minGames` を別表取得へ反映
4. 変更: [app/stats/print/page.tsx](app/stats/print/page.tsx)
   - フィルタ準拠および年間別表取得に `minGames` 条件を反映
5. 変更: [test/stats-subtables.test.js](test/stats-subtables.test.js)
   - 新仕様のテスト追加・期待値更新
6. 変更: [docs/user-manual.md](docs/user-manual.md)
   - 最高得点/最低失点ランキング説明をプレーヤー単位定義へ更新

## 6. 受け入れ条件

1. 最高得点ランキングが「各プレーヤーの期間内最高得点」で構成される。
2. 最低失点ランキングが「各プレーヤーの期間内最低得点」で構成される。
3. 両ランキングとも同一プレーヤーは最大 1 行のみ表示される。
4. 両ランキングは 5 件固定ではなく、対象プレーヤー全員を表示する。
5. `minGames=20` 指定時、対象期間内で 20 試合未満のプレーヤーは候補から除外される。
6. フィルタ（対象期間・試合数）を変えると、ランキング結果が同条件で更新される。
7. 成績集計画面と PDF 出力で同一結果になる。
8. `npm run build` が成功する。

## 7. テスト観点

1. 基本ケース
   - プレーヤー単位で1行に集約されること。
2. 最高/最低の抽出
   - 各プレーヤーの `max(score)` / `min(score)` が正しく選ばれること。
3. 同値タイブレーク
   - 同じ代表値を複数回達成した場合に `createdAt` 降順で最新が採用されること。
4. 試合数条件
   - `minGames` なし: 全プレーヤー候補
   - `minGames=20`: 有効プレーヤーのみ候補
5. 期間条件
   - `year` / 開催日 / `custom` の各フィルタで結果が一致すること。
6. 表示整合
   - 成績画面と印刷ページの別表が同じ内容になること。

## 8. リスクと対策

1. 代表値採用ルールの不明確さ
   - リスク: 同値時にどの対局が表示されるかが揺れる。
   - 対策: `createdAt` 優先ルールを実装・テスト・ドキュメントで固定する。

2. `minGames` 適用位置の齟齬
   - リスク: 画面と PDF で候補プレーヤーがズレる。
   - 対策: `fetchStatsSubtables` 側で一元判定し、呼び出し側は同一引数を渡す。

3. 過去の「明細単位」認知との差分
   - リスク: 利用者が件数減少を不具合と誤認する。
   - 対策: マニュアルに「プレーヤー単位ランキング」であることを明記する。

## 9. 実装ステップ（次フェーズ）

1. [lib/stats-subtables.js](lib/stats-subtables.js) の最高/最低ランキング算出をプレーヤー単位へ置換する。
2. [lib/stats-subtables.d.ts](lib/stats-subtables.d.ts) を更新する。
3. [app/stats/page.tsx](app/stats/page.tsx) の別表取得へ `minGames` を接続する。
4. [app/stats/print/page.tsx](app/stats/print/page.tsx) へ同条件接続を反映する。
5. [test/stats-subtables.test.js](test/stats-subtables.test.js) を新仕様で更新する。
6. [docs/user-manual.md](docs/user-manual.md) の説明文を更新する。
7. `npm run build` を実行してビルド成功を確認する。
