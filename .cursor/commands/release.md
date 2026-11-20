# Release: develop → main

`develop` を `main` へ反映する **リリース PR の作成とマージ** を実行します。  
このコマンドの呼び出し自体が、リリース操作の明示依頼です。

## 変更クラスと承認（Issue #308）

- **`/release` / main への反映は変更クラス（A–D）不問で常に人間承認が必須**
- `/triage` でのクラス合意や設計承認スキップでは **代替できない**
- マトリクス正本: `docs/issue-prompt-guidelines.md`

機能 PR の `develop` へのマージは対象外です（先にマージ済みであること）。

## 開始前チェック

1. 作業ツリーがクリーンであること（未コミット変更があれば停止して確認）
2. `git fetch origin` 後、`origin/develop` が `origin/main` より進んでいること（差分が無ければ報告して停止）
3. 取り込みたい変更がすでに `develop` に入っていること

## 手順

1. `git fetch origin`
2. 既存の open な `base=main` / `head=develop` PR があればそれを使う。無ければ作成:

```bash
gh pr create --base main --head develop \
  --title "release: merge develop into main" \
  --body "$(cat <<'EOF'
## Summary
- develop を main へ反映するリリース PR

## 検証
- 機能 PR 側の検証・CI を確認済み（詳細は取り込み元 PR を参照）

## Worklog
- 取り込み元 PR 実装時に `.worklog/logs/` へ記録済み（gitignore 対象）

## 関連
- 取り込み元: #<機能PR番号>（分かれば記載）

## Issue（本番反映でクローズ）
Closes #<Issue番号>
# 複数ある場合は Closes 行を列挙。GitHub は main マージ時に自動クローズする
EOF
)"
```

`check-worklog` は PR 本文に `worklog` が含まれること（または `.worklog/` 差分）を要求する。テンプレの `## Worklog` を省略しないこと。

**Issue クローズ（本番リリース時・必須）**:
- クローズの正本タイミングは **このリリース PR が `main` にマージされたとき**
- リリース PR 本文に、今回取り込む各 Issue の `Closes #N` / `Fixes #N` を必ず書く（GitHub 自動クローズが動く）
- 取り込み元の特定: 前回リリース以降に `develop` へ入った機能 PR の本文・関連 Issue、ユーザー指定の「取り込み元」

3. リリース PR の CI / 必須チェックを確認。失敗・未完了なら停止して報告
4. 問題なければまず `gh pr merge <releasePR> --merge`（squash / rebase はユーザー明示時のみ）
5. **通常マージが branch lock 等でだけ拒否され、かつ必須チェックがすべて成功している場合に限り**、`gh pr merge <releasePR> --merge --admin` を使ってよい（本コマンド呼び出しが許可根拠）。失敗チェックの回避には使わない
6. `git fetch origin` → 必要なら `git checkout main` → `git pull origin main` で main 反映を確認
7. **Issue クローズの確認（必須）**: リリース PR で列挙した Issue がまだ open なら `gh issue close <N> --reason completed` で閉じる（自動クローズ漏れの保険。コメントにリリース PR 番号を残す）
8. **必須: `main` → `develop` 同期の確認**（詳細は下記）。未完了のまま `/release` を終わらせない
9. リリース PR URL・同期結果（自動化 job / sync PR）・マージ結果・クローズした Issue を要約して提示する（`--admin` を使った場合はその旨も明記）
10. マージ済み作業ブランチの削除は、ユーザーが依頼したとき、または委任ガイドの後処理指示があるときのみ行う（`develop` / `main` は削除しない）

## リリース後の develop 同期（必須）

`develop` → `main` を merge コミットで取り込むと、`main` 先端のマージコミットだけが `develop` に無い状態になる（ツリーが同一でも `git merge-base --is-ancestor origin/main origin/develop` は失敗する）。  
通常は **GitHub Actions `Sync main into develop`**（Issue #318 / `.github/workflows/sync-main-into-develop.yml`）が `main` push を受けて sync PR を作成・マージする。**人手に sync PR マージを依頼しない**（デフォルト）。

前提: repo secret `SYNC_MAIN_TO_DEVELOP_TOKEN` が設定済みであること。

### 通常経路（自動化待ち）

1. `git fetch origin main develop`
2. 最大約 3 分、15–30 秒間隔で `git merge-base --is-ancestor origin/main origin/develop` を再確認する（都度 `git fetch origin main develop`）
3. 成功したら同期完了。可能なら Actions run / sync PR URL を結果に含める。手順 9 へ
4. タイムアウトしても未同期なら、下記フォールバックへ

### フォールバック（自動化失敗・secret 未設定・タイムアウト）

同趣旨の open な sync PR（`base=develop`、head `chore/sync-main-into-develop` 等）があればそれを使う。無ければ作成する例:

```bash
git fetch origin main develop
git checkout -B chore/sync-main-into-develop origin/main
git push -u origin chore/sync-main-into-develop
gh pr create --base develop --head chore/sync-main-into-develop \
  --title "chore: sync main into develop after release" \
  --body "$(cat <<'EOF'
## Summary
- リリース後に `main` のマージコミットを `develop` へ戻す同期 PR（自動化フォールバック）

## 検証
- マージ後に `git merge-base --is-ancestor origin/main origin/develop` が成功すること

## Worklog
- `/release` 後処理の同期のみ（機能実装の worklog は取り込み元 PR 側）
EOF
)"
```

続けて sync PR の CI / 必須チェックを確認し、問題なければ `gh pr merge <syncPR> --merge`（squash / rebase はユーザー明示時のみ）。branch lock 等でだけ拒否され必須チェック成功時に限り `--admin` 可（本コマンド呼び出しが許可根拠）。  
最後に `git fetch origin` 後、`git merge-base --is-ancestor origin/main origin/develop` 成功を確認してから完了とする。

## オプション（ユーザー指示時）

| 指示例 | 動作 |
|---|---|
| `PR だけ` / `マージはしない` | リリース PR 作成まで。main へはマージしない |
| `取り込み元 #N` | PR 本文の関連に記載 |

## 制約

- force push / hard reset / `--no-verify` はしない
- **`--admin` / 管理者マージは本コマンド（`/release`）呼び出し時のみ許可**。チェック失敗の回避には使わない
- `/release` 以外の会話では `--admin` を使わず、通常マージ不可ならユーザーに確認して停止する
- `main` への直接 push はしない（必ず PR 経由）
- 機能 PR → `develop` のマージは行わない（別途ユーザーがマージ、または明示依頼）
- CI 失敗・権限不足のときは停止して確認する
- 参照: `docs/agent-delegation-guide.md`, `AGENTS.md`, `.cursor/rules/project-core.mdc`
