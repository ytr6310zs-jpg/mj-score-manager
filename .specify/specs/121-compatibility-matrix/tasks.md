# Tasks: 相性表（プレーヤー間戦績マトリクス）

**Branch**: `feature/issue-121-compatibility-matrix`  
**Spec**: `.specify/specs/121-compatibility-matrix/spec.md`  
**Plan**: `.specify/specs/121-compatibility-matrix/plan.md`  
**Issue**: #121

---

## Phase 0: 準備

- [ ] **T-00** ブランチ作成  
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/issue-121-compatibility-matrix
  ```

- [ ] **T-01** worklog 起票  
  ```bash
  npm run worklog:start -- \
    --summary "Issue #121 相性表 実装開始" \
    --reason "プレーヤー間戦績マトリクスの新規画面追加" \
    --tags "issue-121,implementation,worklog"
  ```

---

## Phase 1: ロジック実装

- [ ] **T-10** `lib/compatibility.ts` を新規作成  
  - `MatchupRecord` 型定義（wins / losses / draws）
  - `CompatibilityResult` 型定義（players: string[], matrix: Map<string, Map<string, MatchupRecord>>）
  - `computeWinRate(r: MatchupRecord): number` — wins/(wins+losses)*100、0除算は0
  - `buildCompatibilityMatrix(matches: MatchResult[]): CompatibilityResult` — インメモリ集計（export してテスト対象にする）
  - `fetchCompatibilityMatrix(startDate?, endDate?, options): Promise<...>` — fetchMatchResults を呼び出し、buildCompatibilityMatrix に渡す

- [ ] **T-11** `fetchCompatibilityMatrix` に minGames フィルタリングを追加
  - `options: { tournamentId?: number; minGames?: number }` に拡張
  - `buildCompatibilityMatrix` 実行後、各プレーヤーのゲーム数を `matches` から直接カウント
  - `minGames` 閾値未満のプレーヤーを `players` リストと `matrix` から除外（ポストプロセス）

---

## Phase 2: ユニットテスト

- [ ] **T-20** `test/compatibility.test.ts` を新規作成  
  - 4人ゲームの rank 比較 → 勝敗カウント
  - 同着順 → 分けカウント
  - 空の matches → 空のマトリクス
  - wins+losses=0 → 勝率 0%
  - プレーヤー名 trim の確認

- [ ] **T-21** minGames フィルタリングのユニットテストを追加
  - minGames = 20: 1試合のみのプレーヤーが除外されることを検証
  - minGames = 0 または undefined: 全プレーヤーが返ることを検証（「条件なし」選択時相当）

---

## Phase 3: ページ実装

- [ ] **T-30** `app/compatibility/page.tsx` を新規作成  
  - metadata（タイトル: "相性表 | 麻雀成績入力"）
  - `export const dynamic = "force-dynamic"`
  - `getCurrentSession()` でセッション取得
  - `resolveFilterParams()` でクエリパラメータ解析（`minGamesRaw` を含む）
  - `effectiveMinGames` の計算（stats ページと同じロジック: year フィルタ時デフォルト 20）
  - `fetchTournamentOptions()`, `fetchMatchDates()`, `fetchCompatibilityMatrix()` を並列呼び出し（Promise.all）
  - `AppHeader current="compatibility"` を設置
  - `DateRangeFilter` を `showMinGames={true}` / `initialMinGames` で設置、`actionPath="/compatibility"`
  - マトリクステーブルを JSX で描画
    - `overflow-x-auto` ラップ
    - ヘッダー行・列にプレーヤー名
    - 各セル: 勝敗文字列 + 勝率（改行）
    - 対角線・対局なしセル: `-`
    - データなし: 「データがありません」メッセージ

- [ ] **T-31** 行プレーヤーごとの勝率上位3位セル背景色を実装
  - 勝率（小数1位）降順で行内ランキング
  - 同率は同順位（同じ背景色）
  - 色は `lib/stats-rank-theme.ts` の `RANK_ROW_BG` を再利用
  - 順位バッジは表示しない

- [ ] **T-32** minGames フィルターのページ側実装（T-11 に対応）
  - `resolveFilterParams` に `minGamesRaw: params?.minGames` を渡す
  - `effectiveMinGames` を計算（year フィルタ時のデフォルト 20 を含む）
  - `fetchCompatibilityMatrix` に `{ minGames: effectiveMinGames }` を渡す
  - `DateRangeFilter` を `showMinGames={true}` に変更し `initialMinGames` を渡す

---

## Phase 4: ヘッダー変更

- [ ] **T-40** `components/app-header.tsx` の `NavTarget` 型に `"compatibility"` を追加  
  ```diff
  - type NavTarget = "input" | "matches" | "stats" | "admin";
  + type NavTarget = "input" | "matches" | "stats" | "compatibility" | "admin";
  ```

- [ ] **T-41** ナビリンク追加（stats の直後）  
  ```tsx
  <Link href="/compatibility" className={navClass("compatibility")} onClick={handleNavClick("compatibility")} aria-busy={navigatingTo === "compatibility"} aria-disabled={navigatingTo === "compatibility"}>
    相性表
  </Link>
  ```

---

## Phase 5: 検証

- [ ] **T-50** `npm run build` — ビルド成功を確認
- [ ] **T-51** `npm run lint` — Lint エラーなしを確認  
- [ ] **T-52** `npm test` — テスト通過を確認（T-20 の新規テストを含む）
- [ ] **T-53** 手動動作確認  
  - ヘッダーに「相性表」が表示されること
  - `/compatibility` にアクセスしてマトリクスが表示されること
  - フィルタ変更で URL パラメータが更新されマトリクスが再集計されること
  - 対角線セルが「-」になること
  - 未ログインでアクセスするとログインページへリダイレクトされること

---

## Phase 6: コミット・PR

- [ ] **T-60** `git add` + `git commit`（buildが成功していること）
- [ ] **T-61** `git push origin feature/issue-121-compatibility-matrix`
- [ ] **T-62** PR 作成（`gh pr create`、マージ先: `develop`）  
  PR 本文必須項目: 設計概要 / 実装概要 / 検証コマンドと結果 / 手動動作確認 / 既知の未解決事項 / Worklog

---

## 依存関係

```
T-00 → T-01 → T-10 → T-20 (並列可: T-30, T-20)
T-10 → T-30
T-30 → T-31
T-31 → T-40
T-40, T-41 → T-50 → T-51 → T-52 → T-53 → T-60 → T-61 → T-62
```
