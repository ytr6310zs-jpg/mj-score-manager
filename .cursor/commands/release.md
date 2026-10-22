# Release: develop → main

`develop` を `main` へ反映する **リリース PR の作成とマージ** を実行します。  
このコマンドの呼び出し自体が、リリース操作の明示依頼です。

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

## 関連
- 取り込み元: #<機能PR番号>（分かれば記載）
EOF
)"
```

3. リリース PR の CI / 必須チェックを確認。失敗・未完了なら停止して報告
4. 問題なければ `gh pr merge <releasePR> --merge`（squash / rebase はユーザー明示時のみ）
5. `git fetch origin` → 必要なら `git checkout main` → `git pull origin main` で main 反映を確認
6. リリース PR URL とマージ結果を要約して提示する
7. マージ済み作業ブランチの削除は、ユーザーが依頼したとき、または委任ガイドの後処理指示があるときのみ行う（`develop` / `main` は削除しない）

## オプション（ユーザー指示時）

| 指示例 | 動作 |
|---|---|
| `PR だけ` / `マージはしない` | リリース PR 作成まで。main へはマージしない |
| `取り込み元 #N` | PR 本文の関連に記載 |

## 制約

- force push / hard reset / `--no-verify` / 管理者マージでチェック回避はしない
- `main` への直接 push はしない（必ず PR 経由）
- 機能 PR → `develop` のマージは行わない（別途ユーザーがマージ、または明示依頼）
- CI 失敗・権限不足のときは停止して確認する
- 参照: `docs/agent-delegation-guide.md`, `AGENTS.md`, `.cursor/rules/project-core.mdc`
