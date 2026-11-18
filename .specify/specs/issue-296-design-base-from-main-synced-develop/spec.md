---
title: /design 開始時に main 取り込み済み develop から機能ブランチを切る
owner: @ytr6310zs-jpg
created: 2026-11-18
issue: 296
---

背景
--
Cloud Agent で `/design` → 実装へ進むとき、作業ツリーが古い `develop` のままだと次が起きる。

1. **hard lock**: fail-closed の `.cursor/hooks` が `main` にだけあると、`develop` 由来ブランチへ移った瞬間にフックスクリプトが消え、ツール実行が全部止まる（#294 対応中に発生）
2. **劣化作業**: 止まらなくても、`main` にある修正・ルール・CI を知らずに古い `develop` 上で設計・実装が進む

本 Issue 着手時の実測（2026-11-18 JST）: `origin/develop` は `origin/main` を含んでおらず、ローカル FF 後の `git push origin develop` は protected branch（PR 必須）で拒否された。

目的
--
`/design` の入口で次を必須にする。

1. `git fetch origin main develop`
2. `origin/develop` が `origin/main` を含んでいるか確認する
3. 含んでいない場合
   - 衝突が無ければローカルで `main` → `develop` を取り込む
   - `develop` をリモート更新できる場合のみ更新する（無条件の黙った push はしない）
   - 衝突がある、または `develop` へ push できない場合は **Spec 作成前に停止して報告**する
4. 確認後の tip（remote `develop` が main を含む状態、またはユーザー承認済みの同期手段完了後）から機能ブランチを切る
5. そのブランチ上で Spec 3 点（`spec.md` / `plan.md` / `tasks.md`）を作成する

受け入れ条件
--
- `/design` が、Spec 作成前に `develop` と `main` の関係を確認する
- `develop` が `main` を含まないとき、マージ試行または明示停止のいずれかになる（古い `develop` のまま Spec を書き始めない）
- 機能ブランチは確認後の tip から切られる
- 衝突時・`develop` push 不可時の停止条件が文書化されている
- protected `develop` 時の推奨リカバリ（sync PR 作成 → マージ待ち → 再開）が文書化されている
- #294 の workflow 変更は本 Issue に含めない

非スコープ
--
- #294 の `ci.yml` / `required-files.yml` 変更
- ブランチ保護や必須ステータスチェックの追加・変更
- husky / fail-closed フック本体の仕様変更（配置前提の文書化のみ）
- アプリコード・DB スキーマ変更

影響範囲（実装時）
--
- `.cursor/commands/design.md`（手順の正本・必須）
- `.cursor/rules/project-core.mdc` および/または `AGENTS.md`（常時ルールの短い記載）
- 必要なら `docs/agent-delegation-guide.md` の設計テンプレ
- 本ディレクトリの spec/plan/tasks

制約
--
- 文書変更のみ。アプリ・CI workflow・hooks 実装は触らない
- ブランチ命名: 既定 `feature/issue-<番号>-<要約>`。Cloud Agent の命名規則（例: `cursor/<要約>-<suffix>`）がある場合はそちらを優先してよい旨を明記する
- マージ先既定は引き続き `develop`
- 「毎回黙って `develop` へ push」は禁止。更新手段は FF/マージ成功かつ push 成功、または sync PR 経由に限る

ユーザーストーリー
--
### US1 — 最新 develop から設計を始める（P1）

Agent が `/design` を実行したとき、Spec 作成前に `main`/`develop` を fetch し、`develop` が `main` を含むことを確認したうえで機能ブランチを切る。

**Acceptance**:
1. Given remote に `main` と `develop` がある, When `/design` を開始する, Then 最初に `git fetch origin main develop` 相当が実行される
2. Given `origin/develop` が `origin/main` を含む, When 確認が通る, Then その tip から機能ブランチを切り Spec 3 点を作成する

### US2 — 古い develop では止まって報告する（P1）

`develop` が `main` を含まない、または同期不能なとき、古い tip のまま Spec を書き始めない。

**Acceptance**:
1. Given `origin/develop` が `origin/main` を含まない かつ 衝突なし, When ローカル取り込み後に `develop` push が成功する, Then remote `develop` 更新後に機能ブランチを切る
2. Given 同上 かつ `develop` push が protected 等で失敗する, When `/design` を続行しようとする, Then Spec 作成前に停止し、理由と推奨リカバリ（sync PR）を報告する
3. Given merge 衝突がある, When 取り込みを試みた, Then 衝突解消を自動で強行せず停止・報告する

エッジケース
--
- `origin/develop` または `origin/main` が未取得・欠落
- FF 不可だが衝突なしの merge commit が必要な場合
- Cloud Agent が既に別ブランチにいる / dirty worktree
- sync PR が既に open している場合（新規を乱立せず既存を指す）

テスト
--
- ユニット: 対象外（文書のみ）
- ビルド: `npm run build`（文書のみでもリポジトリ慣例として実装フェーズで実行）
- 手動: `/design` 手順を読み、Spec 作成前ゲートが抜け漏れなく追えること。本 Issue 着手時の push 拒否ログを受け入れ根拠として参照可

参考
--
- Issue #296
- Blocks: #294
- `.cursor/commands/design.md`（現行・ゲート未記載）
- `.cursor/rules/project-core.mdc`
- `AGENTS.md`
- `docs/agent-delegation-guide.md`
