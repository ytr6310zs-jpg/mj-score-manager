# tasks.md — Issue #221: gamesテーブルの飛ばし関連カラム移行と重複解消

## フェーズ1: コード変更（non-breaking）

- [ ] **T1-1** `lib/matches.ts` — SELECT文から旧カラム6列を除去
  - 除去対象: `is_tobashi1`, `is_tobashi2`, `is_tobashi3`, `is_tobashi4`, `tobashi_player`, `tobashi_player_id`

- [ ] **T1-2** `lib/matches.ts` — `tobashiPlayerIds` 計算を `players` マップより前に移動し、`isTobashi` 導出を `tobashiPlayerIds.includes(playerId)` へ変更

- [ ] **T1-3** `lib/matches.ts` — `MatchResult` 型から `tobashiPlayer` / `tobashiPlayerId` フィールドを削除

- [ ] **T1-4** `lib/matches.ts` — row マッピングから `tobashiPlayer` / `tobashiPlayerId` の代入を削除

- [ ] **T1-5** `lib/stats.ts` — `tobashiPlayerId` legacy fallback ブランチ（else if 節）を削除

- [ ] **T1-6** `lib/validate-match.ts` — `tobashiPlayer` 単一フィールドのパースと fallback を削除

- [ ] **T1-7** `lib/validate-match.ts` — `ParsedMatchData` 型から `tobashiPlayer: string | null` を削除

- [ ] **T1-8** `lib/validate-match.ts` — `buildRankedEntries` の `tobashiPlayer` パラメータを削除し、`isTobashi` 判定を `tobashiPlayers.includes(player)` のみへ簡略化

- [ ] **T1-9** `app/actions.ts` — insert payload から `tobashi_player`, `tobashi_player_id`, `is_tobashi{slot}`, `is_tobashi4` の書き込みを削除。`tobashiPlayer` を参照している変数も整理

- [ ] **T1-10** `app/match-actions.ts` — update payload から `tobashi_player`, `tobashi_player_id`, `is_tobashi{slot}`, `is_tobashi4` の書き込みを削除

- [ ] **T1-11** `components/score-form.tsx` — `<input type="hidden" name="tobashiPlayer" ...>` を削除

- [ ] **T1-12** `components/match-edit-form.tsx` — `form.append("tobashiPlayer", ...)` を削除

- [ ] **T1-13** `npm run build` を実行し型エラーがないことを確認

---

## フェーズ2: スキーマ変更（breaking）

- [ ] **T2-1** `supabase/migrations/20260508000000_drop_legacy_tobashi_columns.sql` を作成
  - ALTER TABLE games DROP COLUMN IF EXISTS (is_tobashi1..4, tobashi_player, tobashi_player_id)

- [ ] **T2-2** ローカル環境でマイグレーション適用確認
  - `npm run supabase:reset` を実行してフルマイグレーションが通ることを検証

- [ ] **T2-3** `npm run build` を再実行して問題がないことを確認

---

## テスト・動作確認

- [ ] **T3-1** E2Eテスト `score-entry.spec.ts` の飛ばし関連テスト（"submits 4-player game with tobi and tobashi options"）が通過すること

- [ ] **T3-2** ローカル環境でスコア入力フローを手動確認（飛ばしあり・なし両方）

- [ ] **T3-3** ローカル環境で対局編集フロー（飛ばし編集）を手動確認

- [ ] **T3-4** 統計画面で飛ばし回数が正しく表示されることを確認

---

## コミット・PR

- [ ] **T4-1** worklog 起票: `npm run worklog:start`

- [ ] **T4-2** フェーズ1コミット（コード変更）

- [ ] **T4-3** フェーズ2コミット（マイグレーション）

- [ ] **T4-4** `feature/issue-221-tobashi-column-migration` ブランチへ push

- [ ] **T4-5** PR 作成（`develop` ブランチへ）、本番移行手順とロールバック方針を明記
