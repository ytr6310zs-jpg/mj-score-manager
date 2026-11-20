# Implementation Plan: リリース後の main → develop 同期自動化

**Branch**: `feature/issue-318-auto-sync-main-develop` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)  
**Status**: Approved — 実装中  
**Related Issue**: [#318](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/318)

## Summary

`main` への push をトリガに、GitHub Actions が `chore/sync-main-into-develop` ブランチと `develop` 向け sync PR を用意し、専用トークンでマージする。`develop` の PR 必須は維持。`/release` は自動化完了の検証＋失敗時フォールバックに更新する。

## Technical Context

**Language/Version**: GitHub Actions (YAML) + `gh` CLI  
**Primary Dependencies**: GitHub branch protection, repository secrets  
**Storage**: N/A（git refs / PRs）  
**Testing**: workflow_dispatch での手動実行、包含チェック、docs レビュー  
**Target Platform**: GitHub.com hosted runners  
**Project Type**: CI/CD / repository operations  
**Constraints**: PR 必須維持、機能 PR 自動マージ禁止、最小差分  
**Scale/Scope**: workflow 1 + docs 数ファイル + secret 設定手順

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| I. Domain-First | PASS | スコアドメイン非対象 |
| II. Spec-Driven | PASS | 本 Spec で進める |
| III. Security | PASS | PAT をコードに書かない。secret 名のみ文書化 |
| IV. Quality Gates | PASS | docs + workflow。`npm run build` は回帰確認 |
| V. Minimal Diff | PASS | 同期自動化に閉じる |

## Project Structure

```text
.github/workflows/sync-main-into-develop.yml   # NEW
.cursor/commands/release.md                    # UPDATE（待ち／フォールバック）
.cursor/commands/design.md                     # UPDATE（自動化前提の一文、任意最小）
AGENTS.md                                      # UPDATE（/release 説明が必要なら最小）
.specify/specs/issue-318-auto-sync-main-develop/
```

## Design Decisions

### D1: Trigger = push to main (+ workflow_dispatch)

- リリース PR マージは `main` への push になるため拾える
- `workflow_dispatch` で失敗後の再実行が可能

### D2: Sync via PR then merge（not direct push to develop）

- `develop` は PR 必須。直接 push は保護と矛盾しうる
- 承認数 0・必須チェックなしのため、PR 作成直後の `gh pr merge --merge` が可能（2026-11-20 調査）
- 将来承認が必須になったら本 workflow は失敗する → README/workflow コメントに前提を書く

### D3: Credential = `SYNC_MAIN_TO_DEVELOP_TOKEN`

- **Why not only `GITHUB_TOKEN`**: protected branch への操作・後続 workflow 起動の制限があり、環境によりマージや PR 作成が不安定
- **Required scopes（fine-grained PAT 例）**: このリポジトリへの Contents: Read and write、Pull requests: Read and write
- Token 所有者: リポジトリ書込可能なユーザー（または GitHub App）。Actions 設定で secret 登録は人間作業（実装 PR の手動確認に含める）
- Workflow の `checkout` / `gh` は `token: ${{ secrets.SYNC_MAIN_TO_DEVELOP_TOKEN }}` を使う

### D4: Branch ownership = `chore/sync-main-into-develop`

- tip を `origin/main` に合わせて push（必要なら force-with-lease）
- open PR があれば再利用。なければ作成。タイトル例: `chore: sync main into develop after release`

### D5: /release behavior after automation

1. リリース PR を `main` にマージ
2. Issue クローズ確認（既存）
3. **同期**: `git fetch` 後、短時間ポーリングで包含を確認（例: 最大 2–3 分、15–30 秒間隔）
4. 成功 → sync PR URL は Actions / 既存 PR から参照できれば記載。人手マージ依頼はしない
5. 失敗・タイムアウト → 現行どおり sync PR を作成（または open を案内）し、マージまでフォールバック

## Workflow Sketch

```yaml
name: Sync main into develop
on:
  push:
    branches: [main]
  workflow_dispatch:
concurrency:
  group: sync-main-into-develop
  cancel-in-progress: false
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
          token: ${{ secrets.SYNC_MAIN_TO_DEVELOP_TOKEN }}
      - name: Check if already synced
        # merge-base --is-ancestor origin/main origin/develop && exit 0
      - name: Ensure sync branch == main
        # git branch -f chore/sync-main-into-develop origin/main && push
      - name: Create or reuse PR into develop
        # gh pr list / gh pr create
      - name: Merge PR
        # gh pr merge --merge
      - name: Verify ancestry
```

（実装時に正確なコマンドへ落とし込む。sketch は方針固定用）

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Secret 未設定で workflow 失敗 | PR 本文／tasks に設定手順。初回は workflow_dispatch で検証 |
| エージェントが同名ブランチを使用中 | 自動化専用と文書化。force-with-lease で main tip に合わせる |
| 承認必須化で即マージ不可 | 前提をコメント。壊れたら auto-merge + レビュー緩和または App 承認を別 Issue |
| 無限ループ | `develop` へのマージは `main` push を起こさない（通常）。concurrency で二重実行抑制 |
| トークン漏洩 | secret のみ。ログに token を出さない |

## Verification Plan

- Secret 設定後、`workflow_dispatch` で実行（未同期を意図的に作るか、noop を確認）
- 擬似: sync を戻す危険な操作は本番では避ける。可能なら「すでに同期済み → noop」と「手元で包含が一時的に崩れているか」を分離して検証
- `npm run build`（回帰）
- docs: `/release` の読み通し

## Open Decisions

Spec の D1–D4 を承認時に確定。追加の未決なし（トークン種類は PAT fine-grained を既定とし、GitHub App は将来オプション）。

## Related

- #296, #306
- PR #317（Issue クローズはリリース時）— 非混在
