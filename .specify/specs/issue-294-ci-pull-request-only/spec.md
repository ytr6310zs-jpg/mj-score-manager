---
title: CI の起動条件を pull_request に揃える
owner: @ytr6310zs-jpg
created: 2026-11-18
issue: 294
---

背景
--
`push` と `pull_request` の両方で同じ検査が走り、PR Checks に同名の成功が並ぶ（#291 / #293 で確認）。実装は未着手だったが #296 でブロックされ、#296 マージ後に再開する。

目的
--
検査系 workflow の起動を `pull_request` に揃え、同一コミット／同一 PR での重複実行を止める。

受け入れ条件
--
- 機能ブランチの 1 push につき、`check-files` が `pull_request` の 1 回だけになる
- `develop` 向け PR で `unit` と `integration` が 1 回ずつ動く
- `develop` → `main` のリリース PR で、合成マージに対する CI が 1 回動く
- `check-worklog`、`check-spec`、`check-migrations`、`migrate.yml` の起動条件は変わらない

非スコープ
--
- #193 の E2E smoke / nightly 化
- `migrate.yml` の `main` push（schema 適用）
- ブランチ保護や必須ステータスチェックの追加
- `concurrency` キーの変更

影響範囲
--
- `.github/workflows/ci.yml`（`on:` のみ）
- `.github/workflows/required-files.yml`（`on:` のみ）
- 本ディレクトリの spec/plan/tasks

変更後の起動（期待）
--
| 出来事 | CI (`unit` / `integration`) | `check-files` |
|---|---|---|
| 機能ブランチへの push | 動かない | 動かない |
| `develop` 向け PR | マージ結果を 1 回 | 1 回 |
| `develop` へマージした直後の push | 動かない | 動かない |
| `main` 向けリリース PR | 合成マージを 1 回 | 1 回 |

既知の穴（許容）
--
保護を迂回した `main` / `develop` への直接 push では CI も `check-files` も動かない。通常の PR 経路ではマージ前の `pull_request` が検査になる。

ユーザーストーリー
--
### US1 — PR Checks の重複を消す（P1）

開発者が機能 PR を push したとき、`check-files` と CI がそれぞれ 1 系統だけ走る。

**Acceptance**:
1. Given base が `develop` の PR, When head を 1 回 push する, Then `check-files` は `pull_request` 由来の 1 回のみ
2. Given 同上, When 同上, Then `unit` / `integration` は各 1 回（`push` 由来が無い）

### US2 — リリース PR でも 1 回（P1）

`develop` → `main` のリリース PR では合成マージに対する検査だけが走る。

**Acceptance**:
1. Given head=`develop` base=`main` の PR, When PR が open/synchronize する, Then CI は `pull_request` の 1 回
2. Given その直前に `develop` へ push があった, When 同上, Then その push では CI / `check-files` が起動しない

エッジケース
--
- `required-files.yml` の `pull_request.branches` を `main`/`develop` に狭める（現状 `**`）。他 base への PR では `check-files` が動かなくなるが、本リポジトリの既定マージ先は `develop` / リリースは `main` のみ
- fork PR: `pull_request` のみでも従来どおり検査対象（変更しない）

テスト
--
- ユニット: 対象外
- ビルド: `npm run build`（workflow のみでも慣例として実行）
- 手動/検証: YAML の `on:` 差分レビュー。マージ後の実 PR で Checks が 1 系統になることを確認（本 PR 自身が最初の観測点）

参考
--
- Issue #294
- Blocked by（解消済み）: #296
- 関連別件: #193
