# Task Breakdown: アプリ / CI / staging の Node.js 24 移行

**Feature Branch**: `feature/issue-285-nodejs-24-runtime`  
**Related Issue**: #285  
**Last Updated**: 2026-10-22

---

## Task List

### Task 1: engines / Volta / README / app-spec 更新
- **Acceptance**: `package.json` / `app-spec.yaml` / `README.md` が Node 24 + npm 11 を指す
- **Depends on**: なし

### Task 2: workflow の node-version を 24 に変更
- **Acceptance**: `ci.yml` / `migrate-common.yml` / `reset-and-seed-players.yml` が `24`
- **Depends on**: Task 1

### Task 3: ローカル検証
- **Acceptance**: Node 24.22.1+ で `npm ci` / `npm run build` / `npm run lint` 成功
- **Depends on**: Task 1, Task 2

### Task 4: PR → develop、CI 緑
- **Acceptance**: PR 作成、CI unit + integration 成功
- **Depends on**: Task 3

### Task 5: staging 動作確認
- **Acceptance**: Vercel Node 24.x、Preview デプロイ、手動チェックリスト記録
- **Depends on**: Task 4
