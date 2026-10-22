# Implementation Plan: アプリ / CI / staging の Node.js 24 移行

**Feature Branch**: `feature/issue-285-nodejs-24-runtime`  
**Last Updated**: 2026-10-22  
**Related Issue**: #285

---

## 実装戦略

1. `package.json` の `engines` / `volta` / `packageManager` を Node 24.x + npm 11.x に更新
2. `.github/specs/app-spec.yaml` と `README.md` の Node 記述を同期
3. CI / migrate / reset-and-seed の `node-version` を `24` に変更
4. ローカルで Node 24.22.1+ を入れ、`npm ci` → build / lint / test
5. PR → develop、CI 緑確認
6. Vercel Project Settings を 24.x にし、staging Preview を再デプロイして手動確認

---

## 変更の概要

| 対象 | 現在 | 変更予定 |
|---|---|---|
| `engines.node` | `>=20.19.0 <21` | `24.x` |
| `engines.npm` | `>=10.8.2 <11` | `>=11 <12` |
| `volta.node` | `20.19.0` | `24.22.1` |
| CI / migrate / reset `node-version` | `20` | `24` |

---

## リスク・影響範囲

| リスク | 対応 |
|---|---|
| npm 11 / lockfile 差分 | `npm ci` と CI で早期検知 |
| Vercel ビルドキャッシュが古い Node を掴む | Project Settings で 24.x を明示 |
| Next.js 15.5 との非互換 | `npm run build` 失敗時は停止して報告 |

---

## 検証方針

- ローカル: `npm run build`, `npm run lint`, 可能な範囲で test
- CI: unit + integration 成功
- staging: ビルドログで Node 24、手動チェックリスト
