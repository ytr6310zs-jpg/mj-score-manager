# ADR 0006: games にプレイヤー参照 ID を導入し、表示用プレイヤー名を併存させる

日付: 2026-04-03
ステータス: accepted
作成者: プロジェクト（個人開発）

## 背景

`games` テーブルは player1..player4、top_player、last_player、tobi_player、tobashi_player、yakitori_players を
プレイヤー名文字列で保持している（`supabase/migrations/20260401000001_create_games.sql`）。

この構造では `players` テーブルとの参照整合性が弱く、次の問題がある。

- プレイヤー名変更時に履歴・集計・CSV の整合が崩れやすい。
- 集計クエリや JOIN がプレイヤー名文字列の完全一致前提になる。
- 役満記録（`yakuman_occurrences`）は `players.id` を外部キーとして持つが、`games` 本体は名前文字列のみのため参照が非対称。

Issue #57 の最低要件は「games に player.id を格納しつつプレイヤー名も残す」こと。

## 決定

1. `games` の既存 player 名列は対局時点のスナップショットとして**残す**（非破壊移行）。
2. 参照整合性用の player ID 列を新たに追加する。
3. 参加者列（player1_id..player4_id）に加え、派生参照列（top/last/tobi/tobashi）も ID 列を持つ。
4. yakitori は複数人を取りうるため、既存の `yakitori_players`（text）を残しつつ、`yakitori_player_ids`（jsonb）を追加する。
5. 新しい外部キーはすべて `players(id)` を参照し、削除時は `ON DELETE SET NULL` とする。
6. 新列は初回 migration では `NULLABLE` で導入し、backfill 後も即時 NOT NULL 化しない。

## Migration 列定義（`20260403000000_games_add_player_ids.sql`）

```sql
-- player 参加者 ID 列
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS player1_id        BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player2_id        BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player3_id        BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player4_id        BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL;

-- 派生参照 ID 列
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS top_player_id     BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_player_id    BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tobi_player_id    BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tobashi_player_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL;

-- 焼き鳥 ID 配列（jsonb）
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS yakitori_player_ids JSONB NULL;
```

インデックス:
- player1_id〜player4_id: 各 B-tree インデックス
- top/last/tobi/tobashi_player_id: 各 B-tree インデックス
- yakitori_player_ids: GIN インデックス

## Data migration 方針（`20260403000001_games_backfill_player_ids.sql`）

- 既存行は `players.name` 完全一致で `player*_id` / 派生 ID 列を backfill する。
- `yakitori_players`（カンマ区切り）はカンマで分解して `players.name` と照合し、数値 ID の JSON 配列を `yakitori_player_ids` に格納する。
- 一致しない name・空値・欠損は NULL のまま残す（非破壊）。
- migration は停止せず、未解決行はコメントに示した検証 SQL で後追い確認できる。

## アプリケーション変更

### 書き込み系（`app/actions.ts`, `app/match-actions.ts`）
- フォームから受けた player 名一覧を `players` テーブルで一括解決し、`name → id` の Map を作る。
- `games` insert/update 時に name 列と id 列を同時保存する。
- yakitori は name CSV と JSON ID 配列を同時に書く。

### 読み取り系（`lib/matches.ts`）
- `MatchPlayer` に `id: number | null` を追加。
- `MatchResult` に `topPlayerId`, `lastPlayerId`, `tobiPlayerId`, `tobashiPlayerId`, `yakitoriPlayerIds` を追加。
- 取得 select に新列を追加し、mapping で ID を取り出す。
- UI 表示は既存の name 中心を維持する。

### エクスポート（`app/api/export/games/csv-builder.js`）
- `metadata_json` に `top/last/tobi/tobashi_player_id` と `yakitori_player_ids` を含める。
- `player_1_id`〜`player_4_id` は `MatchPlayer.id` から出力する（ADR 0002 / 0004 と整合）。

## 削除時の扱い

- `players` 行削除時に `games` 履歴を消すのは不適切なため `CASCADE` は採用しない。
- `ON DELETE SET NULL` により、対局時点の表示名スナップショットは残り、ID 参照のみ外れる。
- 現行のプレイヤー削除 UI では参照中プレイヤーを削除できてしまうため、将来的には削除前チェックまたは論理削除の導入を別 issue で検討する。

## 理由

- name と id の併存で「履歴表示互換」と「参照整合性」を両立できる。
- `yakuman_occurrences` は既に `player_id` を外部キーとして持つため、`games` 側も ID を持つことで一貫性が上がる。
- nullable 追加と backfill の二段構成により、本番 migration のリスクを最小限に抑えられる。
- 完全正規化（game_players 中間テーブル化）より変更差分が小さく、既存 UI と CSV を壊しにくい。

## 代替案

- **game_players 中間テーブルへ完全正規化する**
  - 長期的には有力だが、保存・取得・集計・CSV を全面的に組み直す必要があり、Issue #57 のスコープを超えるため不採用。
- **player1_id..player4_id だけ追加し、top/last 等は name のまま**
  - 最小差分だが、派生参照の整合性問題が残るため不採用。
- **yakitori を name CSV のままにする**
  - 複数値の参照整合が改善しないため不採用。

## 影響ファイル

| ファイル | 変更内容 |
|---|---|
| `supabase/migrations/20260403000000_games_add_player_ids.sql` | 新規: 列・FK・インデックス追加 |
| `supabase/migrations/20260403000001_games_backfill_player_ids.sql` | 新規: 既存データ backfill |
| `lib/matches.ts` | 型拡張・select・mapping 更新 |
| `app/actions.ts` | 保存時の player ID 解決・二重保存 |
| `app/match-actions.ts` | 編集時の player ID 解決・同期更新 |
| `app/api/export/games/csv-builder.js` | metadata_json への player ID 出力 |
| `app/api/export/games/csv-builder.d.ts` | 型定義更新 |
| `app/api/export/games/handler.d.ts` | 型定義更新 |

## 検証チェックリスト

- [ ] `npx supabase db reset` で migration を適用し、新列・FK・インデックスの存在を確認する。
- [ ] 既存データで backfill 後、player*_id と name の対応件数・未解決件数を確認 SQL で検証する。
- [ ] 新規スコア保存で games に name と id が両方入ることを確認する。
- [ ] 対局編集で name と id が同期して更新されることを確認する。
- [ ] 対局履歴・統計・役満・CSV 出力に回帰がないことを確認する。
- [ ] `npm run test` と `npm run build` を実行してパスすることを確認する。

## 残課題（別 issue 対応）

- `player4 IS NULL AND player4_id IS NULL` が 3 人打ちでは正常、4 人打ちで名前未設定（異常）なのかを区別できるようにする。
- players 削除前のチェックまたは論理削除の導入を別 issue で検討する。
- `app/player-actions.ts` では insert に `display_name` を渡しているが、現行 `players` migration に `display_name` 列がない。このスキーマ差分を別 issue で解消する。
- game_players 中間テーブル化による完全正規化は長期的な選択肢として別 issue で再評価する。
