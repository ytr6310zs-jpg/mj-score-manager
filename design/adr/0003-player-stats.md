# ADR 0003: 個人成績（Player Stats）CSV フォーマット

日付: 2026-03-28
作成者: プロジェクト（個人開発）

## 背景
個人別の集計結果（順位数、平均順位、合計得点、役満回数等）をエクスポートして外部分析やアーカイブに使えるようにする。

## 決定
- 1行=1プレイヤー。集計期間をメタとして付与（start_date, end_date）。
- 必要な指標を列として列挙する。

## スキーマ（提案ヘッダ）
```
player_id,player_name,start_date,end_date,total_matches,total_points,average_score,first_place_count,second_place_count,third_place_count,fourth_place_count,yakuman_count,total_wins,win_rate,notes,source_query,recorded_at,recorded_by
```

## 備考
- 集計基準（期間・ルール）は `source_query` カラムでメタとして残す。
- 日付は ISO 8601 を使用する。

*** End ADR
