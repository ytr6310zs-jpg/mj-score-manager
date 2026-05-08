---
description: "Issue #191 CI最適化 Phase 1 タスクリスト"
---

# Tasks: CI最適化 Phase 1 — migrate-and-test 短縮

**Input**: `.specify/specs/issue-191-ci-optimization-phase1/plan.md`  
**Related Issue**: #191

---

## Phase 1: ブランチ作成・worklog 起票

- [ ] T001 `feature/issue-191-ci-optimization-phase1` ブランチを作成する
- [ ] T002 当日 worklog を起票する (`npm run worklog:start`)

---

## Phase 2: ワークフロー書き換え（`.github/workflows/ci.yml`）

- [ ] T003 既存 `build-and-test` ジョブを `unit` ジョブに書き換える
  - `actions/setup-node` に `cache: 'npm'` を追加
  - `npm run test:coverage` → coverage artifact upload → `npm run build` → `npm run lint`
- [ ] T004 既存 `migrate-and-test` ジョブを削除する
- [ ] T005 `migrate` ジョブを新規追加する
  - `needs: [unit]`
  - npm cache 有効化
  - Supabase start → db push → `npm run test:integration` → `npm run test:e2e`
  - env: DATABASE_URL / SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / ACCESS_PASSWORD
- [ ] T006 `e2e` ジョブを新規追加する
  - `needs: [migrate]`
  - npm cache 有効化
  - `actions/cache@v4` で Playwright ブラウザキャッシュ設定
    - key: `playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`
    - path: `~/.cache/ms-playwright`
  - `npx playwright@latest install --with-deps`
  - Supabase start → db push → `npm run build` → `npm run test:ui` → playwright-report artifact upload (if: always())
  - env: DATABASE_URL / SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / ACCESS_PASSWORD

---

## Phase 3: 検証

- [ ] T007 PR を作成して CI を実行し、3 ジョブ全てが通過することを確認する
- [ ] T008 unit 失敗時に migrate / e2e がスキップされることをログで確認する（または手動コメント）
- [ ] T009 coverage artifact と playwright-report artifact が取得できることを確認する

---

## Phase 4: コミット・push・PR

- [ ] T010 `npm run build` を実行し成功を確認する
- [ ] T011 変更をコミットし feature ブランチへ push する
- [ ] T012 `develop` ブランチへの PR を作成する（本文に必須項目と worklog 記載）
