# Task Breakdown: GitHub Actions の Node.js 20 非推奨警告への対応

**Feature Branch**: `feature/issue-245-github-actions-nodejs-20-deprecation`  
**Total Tasks**: 6  
**Last Updated**: 2026-05-09

---

## Task List

### Task 1: 各 GitHub Action のサポート状況を確認
- **Description**: 
  - `actions/checkout` が Node.js 24 対応か確認（v4 のままか v5 に昇格するか）
  - `actions/setup-node` が Node.js 24 対応か確認
  - `actions/cache` が Node.js 24 対応か確認
  - `actions/upload-artifact` が Node.js 24 対応か確認
- **Acceptance**: 各 action の GitHub リポジトリまたはドキュメントで Node.js 24 対応状況を確認し、対応バージョンを特定できた
- **Depends on**: なし
- **Estimated**: 30m

### Task 2: `.github/workflows/ci.yml` を更新
- **Description**: 
  - Task 1 の結果に基づき、各 action のバージョンを更新
  - 例: `actions/checkout@v4` → `actions/checkout@v4` (v4 が対応の場合) / `actions/checkout@v5` (昇格が必要な場合)
  - 複数行の変更が発生する可能性あり
- **Acceptance**: yaml が有効で、変更内容が Plan に合致している
- **Depends on**: Task 1
- **Estimated**: 20m

### Task 3: ローカルで yaml 構文を検証
- **Description**: 
  - 更新した `.github/workflows/ci.yml` の yaml 構文が正しいか確認
  - IDE や `yamllint` などで構文チェック（不要なら不実施と明記）
- **Acceptance**: yaml 構文エラーがない
- **Depends on**: Task 2
- **Estimated**: 10m

### Task 4: `npm run build` / `npm run lint` を実行し成功を確認
- **Description**: 
  - コード変更がないため、ビルド・lint は確認の意味でのみ実行
  - 失敗時は原因を特定して対応
- **Acceptance**: `npm run build` と `npm run lint` が成功
- **Depends on**: Task 3
- **Estimated**: 10m

### Task 5: GitHub Actions で CI を実行し、警告消失と動作確認
- **Description**: 
  - 更新した workflow で CI を実行
  - CI ログで "Node.js 20 actions are deprecated" 警告が消えたことを確認
  - unit / integration ジョブが従来通り成功することを確認
  - 実行時間の増減を記録
- **Acceptance**: 
  - Node.js 20 非推奨警告がログに出力されない
  - unit / integration ジョブが成功
  - CI 実行時間が大幅に増加していない（±20% 以内）
- **Depends on**: Task 2 (CI push 実行後)
- **Estimated**: 15m

### Task 6: コミット・push・PR 作成
- **Description**: 
  - 変更をローカルでコミット
  - feature ブランチを push
  - develop ベースの PR を作成（PR 本文に Task 5 の検証結果を記載）
  - コミット前に `npm run build` 成功を確認する（必須）
- **Acceptance**: 
  - develop ベースの PR が作成できた
  - PR 本文に設計概要 / 実装概要 / 検証結果 / 未解決事項を記載
- **Depends on**: Task 5
- **Estimated**: 15m

---

## 依存関係図

```
Task 1 (確認)
   ↓
Task 2 (更新)
   ↓
Task 3 (構文検証)
   ↓
Task 4 (ローカルビルド)
   ↓
Task 5 (CI 実行)
   ↓
Task 6 (PR 作成)
```

---

## 実装上の注意点

- **Task 1 の重要性**: 誤ったバージョンに更新すると CI が破綻するため、必ず GitHub Actions のドキュメントで確認
- **yaml 構文**: インデント誤りは yaml パーサーで検出不可の場合があるため、視認確認も併せて実施
- **CI ログ**: 警告消失の確認は CI ラン全体のログを見ること（step ごとの圧縮ログではなく）
