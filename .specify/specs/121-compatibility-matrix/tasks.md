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

---

## Phase 2: ユニットテスト

- [ ] **T-20** `test/compatibility.test.ts` を新規作成  
  - 4人ゲームの rank 比較 → 勝敗カウント
  - 同着順 → 分けカウント
  - 空の matches → 空のマトリクス
  - wins+losses=0 → 勝率 0%
  - プレーヤー名 trim の確認

---

## Phase 3: ページ実装

- [ ] **T-30** `app/compatibility/page.tsx` を新規作成  
  - metadata（タイトル: "相性表 | 麻雀成績入力"）
  - `export const dynamic = "force-dynamic"`
  - `getCurrentSession()` でセッション取得
  - `resolveFilterParams()` でクエリパラメータ解析（minGames なし）
  - `fetchTournamentOptions()`, `fetchMatchDates()`, `fetchCompatibilityMatrix()` を並列呼び出し（Promise.all）
  - `AppHeader current="compatibility"` を設置
  - `DateRangeFilter` を `showMinGames={false}` で設置、`actionPath="/compatibility"`
  - マトリクステーブルを JSX で描画
    - `overflow-x-auto` ラップ
    - ヘッダー行・列にプレーヤー名
    - 各セル: 勝敗文字列 + 勝率（改行）
    - 対角線・対局なしセル: `-`
    - データなし: 「データがありません」メッセージ

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
T-30 → T-40
T-40, T-41 → T-50 → T-51 → T-52 → T-53 → T-60 → T-61 → T-62
```
