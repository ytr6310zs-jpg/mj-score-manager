# Implementation Plan: GitHub Actions の Node.js 20 非推奨警告への対応

**Feature Branch**: `feature/issue-245-github-actions-nodejs-20-deprecation`  
**Last Updated**: 2026-05-09

---

## 実装戦略

### フェーズ 1: 情報収集と検証

1. GitHub Actions の各 action バージョンを確認
   - `actions/checkout` のサポート状況（v4 が Node.js 24 対応か、v5 の有無確認）
   - `actions/setup-node` のサポート状況（v4 が Node.js 24 対応か、v5 の有無確認）
   - `actions/cache` のサポート状況（v4 が Node.js 24 対応か、v5 の有無確認）
   - `actions/upload-artifact` のサポート状況（v4 が Node.js 24 対応か、v5 の有無確認）

2. 各 action の最新バージョンをリポジトリに適用
   - v4 が Node.js 24 対応なら、タグ更新のみで解消
   - v5 以上が必要なら、バージョン昇格を実施

### フェーズ 2: 実装と検証

1. `.github/workflows/ci.yml` を更新
   - 各 action のバージョンを Node.js 24 対応版に変更
   - CI を実行してテスト成功を確認

2. CI ログで警告消失を検証
   - Node.js 20 非推奨警告が出力されないことを確認
   - 既存の unit / integration ジョブが従来通り成功すること

3. 変更前後の比較確認
   - CI 実行時間の増減確認
   - 新しい警告やエラーの有無確認

---

## 変更の概要

| 対象 | 現在 | 変更予定 | 理由 |
|---|---|---|---|
| actions/checkout | v4 | v4（対応確認後） / v5+ | Node.js 24 対応版へ昇格 |
| actions/setup-node | v4 | v4（対応確認後） / v5+ | Node.js 24 対応版へ昇格 |
| actions/cache | v4 | v4（対応確認後） / v5+ | Node.js 24 対応版へ昇格 |
| actions/upload-artifact | v4 | v4（対応確認後） / v5+ | Node.js 24 対応版へ昇格 |

---

## リスク・影響範囲

| リスク | 対応 |
|---|---|
| アクション昇格による互換性破損 | 各 action の GitHub リポジトリで Node.js 24 対応の確認をしてから昇格 |
| CI 実行時間の増加 | 変更前後で実行時間を計測し、閾値（unit 75s/integration 187s の±20%）超過時は見直す |
| 他の GitHub workflow への波及 | 本課題では `.github/workflows/ci.yml` のみ対象。必要に応じて後続課題で管理 |

---

## 検証方針

1. **ローカル検証**: yaml 構文エラーがないか確認
2. **CI 検証**: GitHub Actions で実際に実行し、警告消失と動作確認
3. **ドキュメント**: PR 本文に変更内容と検証結果を記載

---

## 実装スケジュール

- **1日目**: 情報収集 + plan.md / tasks.md 確定
- **2日目**: `.github/workflows/ci.yml` 更新 + CI 実行 + PR 作成
- **マージ**: develop → main PR で進める
