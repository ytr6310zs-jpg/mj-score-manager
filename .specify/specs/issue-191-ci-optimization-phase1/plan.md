# Implementation Plan: CI最適化 Phase 1 — migrate-and-test 短縮

**Branch**: `feature/issue-191-ci-optimization-phase1`  
**Date**: 2026-05-08  
**Spec**: `.specify/specs/issue-191-ci-optimization-phase1/spec.md`  
**Related Issue**: #191

---

## Summary

`.github/workflows/ci.yml` のみを変更し、既存 2 ジョブ（`build-and-test` / `migrate-and-test`）を
3 ジョブ（`unit` / `migrate` / `e2e`）にリプレース。npm キャッシュと Playwright ブラウザキャッシュを追加する。

---

## Technical Context

**Language/Version**: YAML (GitHub Actions)  
**Primary Dependencies**: actions/checkout@v4, actions/setup-node@v4, actions/cache@v4, actions/upload-artifact@v4  
**Storage**: N/A  
**Testing**: 既存の npm test / npm run test:ui をそのまま利用  
**Target Platform**: GitHub Actions ubuntu-latest  
**Performance Goals**: 中央値 4m30s → 3m 以下（30% 削減）  
**Constraints**: Supabase ローカル起動は `migrate` / `e2e` にのみ必要。artifact 取得は維持必須  

---

## 変更ファイル

| ファイル | 変更種別 |
|---|---|
| `.github/workflows/ci.yml` | 既存 2 ジョブを削除し 3 ジョブに書き換え |

---

## 新ジョブ設計

### `unit` ジョブ（旧 `build-and-test` をリプレース）

```
actions/checkout@v4
actions/setup-node@v4 (node-version: '20', cache: 'npm')
npm ci
npm run test:coverage          # unit テスト + coverage 生成
actions/upload-artifact@v4     # coverage-report
npm run build
npm run lint
```

- Supabase 不要
- coverage artifact は継続アップロード
- `needs` なし（最初に実行）

---

### `migrate` ジョブ

```
needs: [unit]
actions/checkout@v4
actions/setup-node@v4 (cache: 'npm')
npm ci
npx supabase@2.84.2 start
npx supabase@2.84.2 db push
npm run test:integration        # DB 依存 integration テスト
npm run test:e2e                # Node.js DB e2e テスト (match-save-to-stats 等)
```

- DB 依存テストのみ実行（Playwright なし）
- `unit` 失敗時はスキップ

---

### `e2e` ジョブ

```
needs: [migrate]
actions/checkout@v4
actions/setup-node@v4 (cache: 'npm')
npm ci
# Playwright ブラウザキャッシュ
actions/cache@v4
  key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
  path: ~/.cache/ms-playwright
npx playwright@latest install --with-deps   # キャッシュミス時のみ実行
npx supabase@2.84.2 start
npx supabase@2.84.2 db push
npm run build                   # Next.js ビルド（Playwright webServer 用）
npm run test:ui                 # Playwright ブラウザ E2E
actions/upload-artifact@v4     # playwright-report (if: always())
```

- `migrate` 失敗時はスキップ
- キャッシュキー: `playwright-<OS>-<package-lock.json hash>`

---

## 期待削減効果

| 項目 | 現状 | 改善後（推定） |
|---|---|---|
| npm install（毎回） | ~60s/ジョブ | ~15s/ジョブ（キャッシュヒット時） |
| Playwright ブラウザ DL | ~120s | ~10s（キャッシュヒット時） |
| unit 失敗時の無駄な Supabase 起動 | 毎回実行 | スキップ |

---

## ロールバック方針

`git revert` で `ci.yml` の差分を戻すだけで即復帰可能。
