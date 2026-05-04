---
title: Issue-209/210/211/212 — Backend P1 実装計画
owner: @copilot
created: 2026-05-04
status: Draft
related_issues:
  - 209
  - 210
  - 211
  - 212
---

背景
--
P1 として設定した Backend & Logic の 4 Issue を 5/10 までに完了する。
- #209: 数え役満が対局履歴編集画面で選択できない
- #210: 飛ばし複数人対応（2人飛ばし=2件カウント）
- #211: セッションタイムアウト 12 時間化
- #212: 試合数フィルタ漏れ修正（/stats と /stats/print の1つ目別表）

確認済み事項
--
- 本番 DB の `yakuman_types` に数え役満は存在する。
- スコア入力画面では数え役満を選択できるが、対局履歴編集画面では選択できない。
- 複数飛ばし保存形式は `tobashi_player_ids`（JSON 配列）を採用する。
- 複数飛ばしの集計は「2人飛ばし = 2件」で計上する。
- PDF 出力は「上段=画面フィルタ準拠」「下段=今年20試合以上固定」の2段構成を維持する。

目的
--
1. 編集画面を含め、役満選択の挙動を画面間で一致させる。
2. 複数飛ばしを入力・保存・集計まで一貫対応する。
3. セッション期限を 12 時間に統一する。
4. 試合数フィルタが別表にも漏れなく適用されるようにする。

非目的
--
- Frontend & UI マイルストーン（#213-#215）の実装。
- PDF 下段（今年20試合以上固定）の仕様変更。

短期実装計画（3〜6ステップ）
--

1. 先行修正: #211 セッション期限 12 時間化
- 作業: `lib/auth.ts` の `SESSION_MAX_AGE_SECONDS` を 1h から 12h へ変更。
- 成果物: `lib/auth.ts` の最小差分。
- 検証: `npm run build`。
- ブランチ: `feature/issue-211-session-timeout-12h`

2. 不具合修正: #209 編集画面の役満選択同期
- 作業: 対局履歴編集画面の役満データ取得経路を、スコア入力画面と同じ `/api/yakumans` ベースに統一。
- 成果物: `components/match-edit-form.tsx`（必要なら共通 hook 側）
- 検証:
  - 手動: スコア入力画面と編集画面の両方で「数え役満」を選択可能。
  - `npm run build`
- ブランチ: `feature/issue-209-kazoe-yakuman-edit-fix`

3. ロジック修正: #212 別表の minGames フィルタ漏れ解消
- 作業: `lib/stats-subtables.js` の別表生成で `eligiblePlayers` を点差表にも適用。上段は URL フィルタ準拠、下段は 20 試合固定の現仕様を維持。
- 成果物: `lib/stats-subtables.js`（必要なら型定義）
- 検証:
  - 手動: minGames=20 で 19 試合のプレイヤーが上段別表に出ない。
  - 境界確認: 19/20/21
  - `npm run build`
- ブランチ: `feature/issue-212-min-games-filter-fix`

4. データ拡張: #210 tobashi_player_ids 追加（互換維持）
- 作業: `games` に `tobashi_player_ids`（JSON 配列）を追加し、既存 `tobashi_player`/`tobashi_player_id` は後方互換で維持。
- 成果物: `supabase/migrations/*_add_tobashi_player_ids.sql`、保存/読取ロジックの更新。
- 検証:
  - 手動: 2人飛ばしを登録・編集できる。
  - `npm run build`
- ブランチ: `feature/issue-210-multi-tobashi`

5. UI 反映: #210 チェックボックス入力対応
- 作業: スコア入力画面と対局履歴編集画面の飛ばし UI をチェックボックス化（A案）。
- 成果物: `components/score-form.tsx`、`components/match-edit-form.tsx`。
- 検証:
  - 手動: 複数選択が可能、保存後の再編集で選択状態が復元。
  - `npm run build`
- ブランチ: `feature/issue-210-multi-tobashi`

6. 集計整合: #210 のカウント仕様反映
- 作業: 複数飛ばしを「人数分カウント」へ統一（2人飛ばし=2件）。
- 成果物: 集計ロジック更新（該当 `lib/*`）。
- 検証:
  - 手動: 2人飛ばし対局を含む期間で飛ばし回数が +2 される。
  - `npm run build`
- ブランチ: `feature/issue-210-multi-tobashi`

CI / 運用制約
--
- 各 Issue は `feature/issue-<番号>-<要約>` ブランチを使用。
- 各修正後に `npm run build` を必須実行。
- スキーマ変更は `supabase/migrations/` を正とする。
- 既存データ互換性を壊さない（旧カラム読み取りを維持）。

影響範囲
--
- 認証: `lib/auth.ts`
- 役満選択: `components/match-edit-form.tsx`（必要に応じて `lib/useYakumans.ts`）
- 集計別表: `lib/stats-subtables.js`, `app/stats/page.tsx`, `app/stats/print/page.tsx`
- 複数飛ばし: `components/score-form.tsx`, `components/match-edit-form.tsx`, `app/match-actions.ts`, `lib/matches.ts`, `supabase/migrations/*`

設計レビュー（自己レビュー）
--
- 要件網羅: A1〜A7 を反映済み。
- 競合リスク: #210 は DB/画面/集計の横断変更のため、段階的マージを推奨。
- 未解決事項: なし（実装詳細で命名のみ最終決定）。
- worklog 作成確認: 実装フェーズ開始時に `npm run worklog:start` を実行して記録を残す。
