# Issue #167 設計: 大会管理機能追加、および付帯機能追加（改訂版）

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/167
- タイトル: 大会の管理機能追加、および、付帯機能追加
- 改訂日: 2026-04-19
- 改訂内容: 大会初期選択ルールを「当日最初に固定」から「最後に使った大会を記憶」に変更し、対局履歴/成績集計/PDF 出力への大会選択機能追加を設計に反映。

## 1. 目的

既存データを初期大会へ整理したうえで複数大会運用を可能にし、入力系だけでなく閲覧系（対局履歴・成績集計・PDF 出力）でも大会単位の絞り込みを提供する。

1. 大会マスタを追加し、対局を大会に所属させる。
2. 管理画面で大会を CRUD できるようにする。
3. スコア入力・対局履歴・成績集計・PDF 出力で大会選択を可能にする。
4. 画面横断で「最後に使った大会」を記憶し、初期選択として再利用する。

## 2. 現状

- 対局は [supabase/migrations/20260401000001_create_games.sql](supabase/migrations/20260401000001_create_games.sql) の games テーブルで管理され、大会列は未定義。
- フィルタ解決は [lib/filter-params.ts](lib/filter-params.ts) で実装され、現在は日付系パラメータと試合数のみ扱う。
- 対局履歴は [app/matches/page.tsx](app/matches/page.tsx) で、開催日候補は [lib/matches.ts](lib/matches.ts) の fetchMatchDates から取得している。
- 成績集計は [app/stats/page.tsx](app/stats/page.tsx) で、年初期表示時に minGames=20 を暗黙適用するロジックを持つ。
- PDF 出力は [app/stats/print/page.tsx](app/stats/print/page.tsx) でクエリを引き継いでいるが、大会条件は存在しない。
- フィルタ UI は [components/date-range-filter.tsx](components/date-range-filter.tsx) で共通化されている。

## 3. 要件整理（改訂後）

1. tournaments テーブルを追加する。
2. games に tournament_id を追加し、既存全件を初期大会（大会1）へ紐付ける。
3. プレーヤーは引き続き共通マスタ運用とする。
4. 管理画面に大会管理（新規・編集・削除）を追加する。
5. スコア入力画面で大会選択を必須化する。
6. 「当日最初の大会を固定」ではなく「最後に使った大会を記憶」へ変更する。
7. 対局履歴・成績集計・PDF 出力にも大会選択を追加する。
8. 対局履歴の初期フィルタは「最後に使った大会 + 今年」とする。
9. 成績集計の初期フィルタは「最後に使った大会 + 今年 + 20試合以上」とする。
10. 開催日候補は大会に応じてリスト化する。
11. 印刷画面は成績集計のフィルタ状態（大会含む）を引き継ぎ、大会名を印刷内容に含める。

## 4. スコープ

### 4.1 対象

1. DB スキーマ追加と既存データ移行
2. 大会 CRUD 画面/Action 追加
3. 入力・閲覧・印刷画面への大会フィルタ追加
4. 共通フィルタ解決ロジックの大会対応
5. 開催日候補取得ロジックの大会対応
6. 既存 import/seed スクリプトの tournament_id 対応

### 4.2 非対象

1. 大会ごとのプレーヤーマスタ分離
2. 大会別の権限管理
3. 大会の階層化（シーズン・節など）

## 5. 設計方針

## 5.1 データモデル

追加テーブル: tournaments

- id BIGSERIAL PRIMARY KEY
- name TEXT NOT NULL UNIQUE
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

games 追加列:

- tournament_id BIGINT

制約適用順序:

1. nullable で追加
2. backfill
3. NOT NULL + FK（REFERENCES tournaments(id) ON DELETE RESTRICT）
4. index 追加（idx_games_tournament_id）

## 5.2 マイグレーション

想定 migration:

1. create_tournaments
2. seed_default_tournament（大会1）
3. games_add_tournament_id_and_backfill

backfill 方針:

1. tournaments から name='大会1' の id を取得
2. games.tournament_id is null をその id で更新
3. null 残件 0 を確認して NOT NULL 化

## 5.3 大会記憶仕様（改訂）

採用仕様: 最後に使った大会を記憶して全対象画面の初期選択に使う。

保存先:

- localStorage key: mj-score-manager:last-tournament-id

保存タイミング:

1. スコア入力で大会を選択して送信したとき
2. 対局履歴で大会を変更したとき
3. 成績集計で大会を変更したとき

初期化ルール:

1. 保存値があり、かつ現在の大会一覧に存在する場合はその大会を初期選択
2. 保存値がない、または無効な場合は大会1（なければ先頭）

非採用:

1. 当日最初を固定する方式
   - 理由: ユーザー要求が「最後に使った大会を記憶」へ変更されたため。
2. DB 永続化
   - 理由: ユーザー単位の状態管理が未実装で、今回要件に対して過剰。

## 5.4 フィルタパラメータ設計

共通クエリに tournamentId を追加する。

- tournamentId: string（数値文字列）
- filter: year | custom | YYYY-MM-DD
- start: YYYY-MM-DD
- end: YYYY-MM-DD
- minGames: "" | "20"

変更対象:

1. [lib/filter-params.ts](lib/filter-params.ts)
   - resolveFilterParams に tournamentIdRaw を追加
   - 返却値に tournamentId を追加
2. [components/date-range-filter.tsx](components/date-range-filter.tsx)
   - 大会セレクトを追加
   - hidden input/submit 時に tournamentId を保持

## 5.5 画面別仕様

### 5.5.1 スコア入力

対象: [app/page.tsx](app/page.tsx), [components/score-form.tsx](components/score-form.tsx), [app/actions.ts](app/actions.ts)

1. 大会選択を必須項目として追加
2. 初期値は localStorage の last-tournament-id
3. 保存成功時に last-tournament-id を更新
4. insert payload に tournament_id を含める

### 5.5.2 対局履歴

対象: [app/matches/page.tsx](app/matches/page.tsx), [lib/matches.ts](lib/matches.ts)

1. フィルタ UI に大会セレクトを追加
2. 初期条件は last tournament + 今年
3. fetchMatchResults(start,end,options) へ tournamentId 条件を追加
4. 開催日候補 fetchMatchDates に tournamentId を渡して候補を絞る

### 5.5.3 成績集計

対象: [app/stats/page.tsx](app/stats/page.tsx), [lib/stats.ts](lib/stats.ts), [lib/stats-subtables.js](lib/stats-subtables.js)

1. フィルタ UI に大会セレクトを追加
2. 初期条件は last tournament + 今年 + minGames=20
3. fetchPlayerStats と fetchStatsSubtables が tournamentId 条件を受け取る
4. 開催日候補は大会で絞り込み

### 5.5.4 PDF 出力

対象: [components/pdf-export-button.tsx](components/pdf-export-button.tsx), [app/stats/print/page.tsx](app/stats/print/page.tsx), [app/stats/print/client.tsx](app/stats/print/client.tsx)

1. 成績集計画面のクエリをそのまま引き継ぐ（tournamentId を含む）
2. 印刷用データ取得は同じ tournamentId 条件で実行
3. ヘッダーに大会名を追加
   - 例: 対象大会: 第3回社内リーグ
4. 「今年20試合以上」参考ブロックも、同一大会内で算出する

## 5.6 開催日リストの設計評価

評価対象:

1. A案: games から distinct date を大会条件付きで取得
2. B案: 開催日マスタ（event_dates など）を追加し、tournament_id を保持

比較:

- 実装コスト
  - A案: 低
  - B案: 中〜高（作成/更新/整合性管理が増加）
- データ整合性
  - A案: 実績データ由来のため実表示と一致
  - B案: マスタ先行登録時に games と乖離しうる
- 拡張性（開催日を事前管理したい）
  - A案: 低
  - B案: 高

採用判断:

- 本 Issue では A案（games から取得）を採用する。
- 理由: 現在要件は「実績に基づく絞り込み」であり、開催日事前登録の要求がないため。

将来の移行条件（B案を検討する条件）:

1. 大会日程を事前登録して未実施日も表示したい
2. 大会ごとの営業日/ラウンド管理が必要
3. 開催日単位のメタデータ（会場、メモ、状態）を持たせたい

## 5.7 取得 API 設計

追加/変更案:

1. [lib/tournaments.ts](lib/tournaments.ts) 追加
   - fetchTournaments
   - fetchTournamentOptions
2. [lib/matches.ts](lib/matches.ts)
   - fetchMatchResults(start,end,{ tournamentId? })
   - fetchMatchDates({ tournamentId? })
3. [lib/stats.ts](lib/stats.ts)
   - fetchPlayerStats(start,end,minGames,{ tournamentId? })
4. [lib/stats-subtables.js](lib/stats-subtables.js)
   - fetchStatsSubtables(start,end,topN,{ minGames?, tournamentId? })

## 6. 実装対象ファイル（改訂）

1. 追加: supabase/migrations/*_create_tournaments.sql
2. 追加: supabase/migrations/*_seed_default_tournament.sql
3. 追加: supabase/migrations/*_games_add_tournament_id.sql
4. 追加: [lib/tournaments.ts](lib/tournaments.ts)
5. 追加: [app/tournament-actions.ts](app/tournament-actions.ts)
6. 追加: [app/admin/tournaments/page.tsx](app/admin/tournaments/page.tsx)
7. 追加: [components/tournament-add-form.tsx](components/tournament-add-form.tsx)
8. 追加: [components/tournament-delete-button.tsx](components/tournament-delete-button.tsx)
9. 変更: [app/admin/page.tsx](app/admin/page.tsx)
10. 変更: [lib/filter-params.ts](lib/filter-params.ts)
11. 変更: [components/date-range-filter.tsx](components/date-range-filter.tsx)
12. 変更: [app/page.tsx](app/page.tsx)
13. 変更: [components/score-form.tsx](components/score-form.tsx)
14. 変更: [app/actions.ts](app/actions.ts)
15. 変更: [app/matches/page.tsx](app/matches/page.tsx)
16. 変更: [app/stats/page.tsx](app/stats/page.tsx)
17. 変更: [components/pdf-export-button.tsx](components/pdf-export-button.tsx)
18. 変更: [app/stats/print/page.tsx](app/stats/print/page.tsx)
19. 変更: [app/stats/print/client.tsx](app/stats/print/client.tsx)
20. 変更: [lib/matches.ts](lib/matches.ts)
21. 変更: [lib/stats.ts](lib/stats.ts)
22. 変更: [lib/stats-subtables.js](lib/stats-subtables.js)
23. 変更: [components/match-edit-form.tsx](components/match-edit-form.tsx)
24. 変更: [app/matches/[createdAt]/edit/page.tsx](app/matches/[createdAt]/edit/page.tsx)
25. 変更: [app/match-actions.ts](app/match-actions.ts)
26. 変更: [docs/user-manual.md](docs/user-manual.md)

## 7. 受け入れ条件（改訂）

1. tournaments が作成され、大会1 が存在する。
2. 既存 games 全件が大会1に backfill される。
3. スコア入力で大会選択が必須になる。
4. 対局履歴画面で大会選択できる。
5. 成績集計画面で大会選択できる。
6. 対局履歴初期表示は「最後に使った大会 + 今年」になる。
7. 成績集計初期表示は「最後に使った大会 + 今年 + 20試合以上」になる。
8. 開催日候補は選択大会に応じて切り替わる。
9. PDF 出力は stats 画面の tournamentId/filter/start/end/minGames を引き継ぐ。
10. 印刷内容に大会名が表示される。
11. 管理画面で大会の追加・編集・削除が可能（参照中削除は不可）。
12. npm run build が成功する。

## 8. テスト観点（改訂）

1. マイグレーション
   - 新規環境での作成
   - 既存環境での backfill
2. 大会記憶
   - 最後に使った大会へ更新される
   - 無効 ID は初期大会へフォールバック
3. 対局履歴
   - 初期条件の確認（last tournament + year）
   - 大会変更時に開催日候補が切替
4. 成績集計
   - 初期条件の確認（last tournament + year + minGames20）
   - 大会条件で順位/件数が変化
5. PDF
   - クエリ引継ぎ
   - 大会名表示
   - 大会別に内容が一致
6. 開催日候補
   - games distinct 取得で大会別候補が正しい
7. 既存影響
   - 対局編集
   - CSV 出力
   - import/seed スクリプト

## 9. リスクと対策

1. ローカル記憶による端末差異
   - 対策: 仕様として端末単位であることをマニュアル明記。
2. 大会フィルタの引き回し漏れ
   - 対策: 共通 resolver と共通 UI コンポーネントへ集約。
3. 開催日候補が空になるケース
   - 対策: 対象大会にデータなし時は year/custom のみ選択可にフォールバック。
4. 既存スクリプト失敗
   - 対策: games insert/update の全経路へ tournament_id を追加。

## 10. 実装ステップ（改訂）

1. DB migration を追加して tournaments と games.tournament_id を導入する。
2. 大会 CRUD の service/action/admin 画面を実装する。
3. filter resolver と date-range-filter を tournamentId 対応に拡張する。
4. スコア入力へ大会必須選択と last tournament 記憶を追加する。
5. 対局履歴へ大会フィルタと初期条件（last + year）を追加する。
6. 成績集計へ大会フィルタと初期条件（last + year + 20）を追加する。
7. 開催日候補取得を大会条件付きに変更する。
8. PDF 出力へ tournamentId 引継ぎと大会名印字を追加する。
9. 対局編集・既存スクリプトを tournament_id 対応する。
10. ドキュメント更新後に npm run build を実行する。
