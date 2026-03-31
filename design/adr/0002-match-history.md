# ADR 0002: 対戦履歴（Match History）CSV フォーマット

日付: 2026-03-28
作成者: プロジェクト（個人開発）

## 背景
対局データ（対戦履歴）を外部システムやバックアップ向けにエクスポートできるようにする。検索・集計・再インポートを容易にするため、構造化されたCSVフォーマットを定義する。

## 決定
- 1行=1対局（テーブル単位または大会内の1試合）。プレイヤーの配列はカンマ区切りではなく固定カラム（player_1 .. player_4）で表現する。
- 各プレイヤーについて: `player_id`, `player_name`, `seat`, `score_change`, `final_score` を含める。
- 日時、対局ID、場所/大会名、ラウンド情報、メタ（集計タグ）を含める。

## スキーマ（提案ヘッダ）
```
match_id,match_date,tournament,venue,round_number,table,rule_set,players_count,player_1_id,player_1_name,player_1_seat,player_1_score_change,player_1_final_score,player_2_id,player_2_name,player_2_seat,player_2_score_change,player_2_final_score,player_3_id,player_3_name,player_3_seat,player_3_score_change,player_3_final_score,player_4_id,player_4_name,player_4_seat,player_4_score_change,player_4_final_score,notes,source_file,source_sheet,source_row,recorded_at,recorded_by
```

- `players_count` は 3 または 4 を想定。
- 3人打ちの場合は `player_4_*` カラムを空欄にする。

## 備考
- CSV は UTF-8 (BOMなし) を標準とする。
- 日付/時刻は ISO 8601 形式を使用する。

*** End ADR
