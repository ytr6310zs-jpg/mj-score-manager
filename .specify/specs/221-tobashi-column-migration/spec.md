# spec.md — Issue #221: gamesテーブルの飛ばし関連カラム移行と重複解消

## 概要

`games` テーブルに存在する飛ばし情報の旧カラム群を完全に除去し、`tobashi_player_ids`（jsonb配列）へ一本化する。
非破壊フェーズ（コード変更）→ 破壊フェーズ（DROP COLUMN）の2段階で実施する。

---

## 対象カラム

### 廃止する旧カラム（games テーブル）

| カラム名 | 型 | 廃止理由 |
|---|---|---|
| `is_tobashi1` | BOOLEAN | `tobashi_player_ids` で代替可能 |
| `is_tobashi2` | BOOLEAN | 同上 |
| `is_tobashi3` | BOOLEAN | 同上 |
| `is_tobashi4` | BOOLEAN | 同上 |
| `tobashi_player` | TEXT | `tobashi_player_ids` で代替可能 |
| `tobashi_player_id` | INTEGER | `tobashi_player_ids` で代替可能 |

### 残留する新カラム

| カラム名 | 型 | 説明 |
|---|---|---|
| `tobashi_player_ids` | jsonb | 飛ばしプレイヤーIDの配列。NULL不可・デフォルト `[]` |

---

## 前提・制約

- バックフィル済み: `tobashi_player_ids` に NULL は存在しない（Issue回答より）
- CSV エクスポートは互換性維持不要（新スキーマに準拠）
- マイグレーションは **non-breaking → breaking の2段階**
- ローカル Supabase テスト環境あり（`supabase:reset` / `supabase:db:push`）
- データエクスポート: `pg_dump` またはローカルSupabase CLIで取得可能

---

## スコープ

### フェーズ1: コード変更（non-breaking）

コード上の旧カラム参照・旧フィールドを除去する。DBカラムはまだ残存する。

**変更対象ファイル:**

1. `lib/matches.ts`
   - SELECT文から旧カラム群を除去
   - `MatchResult` 型から `tobashiPlayer: string | null` / `tobashiPlayerId: number | null` を削除
   - `MatchPlayer.isTobashi` の導出を `is_tobashi{slot}` から `tobashiPlayerIds.includes(playerId)` へ変更
   - `tobashiPlayer` / `tobashiPlayerId` マッピングを削除

2. `lib/stats.ts`
   - `tobashiPlayerId` legacy fallback ブランチを削除

3. `lib/validate-match.ts`
   - `tobashiPlayer` 単一フォームフィールドのパース・fallback を削除
   - `ParsedMatchData` 型から `tobashiPlayer: string | null` を削除
   - `buildRankedEntries` の `tobashiPlayer` パラメータを削除

4. `app/actions.ts`
   - insert payload から `tobashi_player`, `tobashi_player_id`, `is_tobashi{slot}` を削除

5. `app/match-actions.ts`
   - update payload から `tobashi_player`, `tobashi_player_id`, `is_tobashi4` を削除

6. `components/score-form.tsx`
   - hidden input `tobashiPlayer` を削除

7. `components/match-edit-form.tsx`
   - `form.append("tobashiPlayer", ...)` を削除

### フェーズ2: スキーマ変更（breaking）

旧カラムを DROP する Supabase マイグレーション SQL を作成する。

**新規ファイル:**
- `supabase/migrations/20260508000000_drop_legacy_tobashi_columns.sql`

---

## 影響範囲

| 種別 | ファイル | 変更内容 |
|---|---|---|
| 型定義 | `lib/matches.ts` | MatchResult 型の旧フィールド削除 |
| 読み取りロジック | `lib/matches.ts` | SELECT・マッピング変更 |
| 統計ロジック | `lib/stats.ts` | legacy fallback 削除 |
| フォームパース | `lib/validate-match.ts` | tobashiPlayer fallback 削除 |
| スコア保存 | `app/actions.ts` | 旧カラムへの書き込み削除 |
| 対局編集 | `app/match-actions.ts` | 旧カラムへの書き込み削除 |
| UI | `components/score-form.tsx` | hidden field 削除 |
| UI | `components/match-edit-form.tsx` | form.append 削除 |
| DB | `supabase/migrations/` | DROP COLUMN マイグレーション追加 |
| テスト | `test/e2e/ui/score-entry.spec.ts` | 飛ばし関連テストの確認・必要に応じ更新 |

---

## 完了条件

- [ ] `games` テーブルから旧カラム6列が完全に除去されている
- [ ] アプリ全体で `tobashi_player_ids` のみで飛ばし機能が成立する
- [ ] `npm run build` が成功する
- [ ] E2Eテスト（score-entry）が通過する
- [ ] ローカルマイグレーション適用後に動作確認が完了している
- [ ] PR に本番移行手順とロールバック方針を明記する

---

## リスク

| リスク | 対策 |
|---|---|
| `MatchPlayer.isTobashi` の再導出で編集フォームの初期値が変わる可能性 | `match-edit-form.tsx` は `match.players.filter(p => p.isTobashi)` で参照するため、MatchPlayer側の正確な導出が最重要 |
| `buildRankedEntries` の `tobashiPlayer` パラメータ削除による呼び出し元の破損 | `actions.ts` / `match-actions.ts` 両方から渡している点に注意 |
| DROP COLUMN後のロールバックは困難 | フェーズ1完了・動作確認後にフェーズ2を実施 |

---

## テスト環境データ移行手順

複数回 migrate を実施する場合の推奨手順:

```bash
# 1. ローカルDBの現データをダンプ
npx supabase@2.84.2 db dump --local -f /tmp/pre-migration-backup.sql

# 2. (必要な場合) DB リセット & マイグレーション再適用
npm run supabase:reset

# 3. シードデータを再投入（必要に応じて）
node scripts/seed-to-supabase.mjs
```

または既存バックアップを利用:
```bash
# pg_restore で .dump ファイルを使用
pg_restore -d <local_db_url> data-output/db-backups/backup-YYYYMMDDTHHMMSSZ.dump
```
