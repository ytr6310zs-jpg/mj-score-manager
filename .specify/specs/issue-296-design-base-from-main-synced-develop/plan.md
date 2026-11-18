---
title: Issue #296 — 実装計画
issue: 296
---

概要
--
`/design` の正本手順に「Spec 作成前の main/develop 同期ゲート」を追加し、常時ルール（`project-core` / `AGENTS.md`）へ短いリマインダを載せる。アプリ・CI・hooks 実装は変更しない。

設計判断
--
1. **正本は `.cursor/commands/design.md`**
   - エージェントが `/design` で必ず読む場所に、番号付きゲートを置く
   - Spec 作成・自己レビュー・停止の既存手順は維持し、その **前** に Git 同期ステップを挿入する

2. **ゲート手順（実装時にそのまま貼れる粒度）**
   1. `git fetch origin main develop`
   2. `git merge-base --is-ancestor origin/main origin/develop` で包含確認
   3. 包含済み → tip=`origin/develop` でブランチ作成へ
   4. 未包含 → ローカルで `develop` を checkout（または一時ブランチ）し `origin/main` を FF 優先で取り込み。衝突なら停止
   5. 取り込み成功後、`git push origin develop` を試行
      - 成功 → その tip から機能ブランチ
      - 失敗（protected 等）→ **停止・報告**。推奨リカバリ: `chore/sync-main-into-develop`（または同等）で `develop` 向け sync PR を作成し、マージ完了まで Spec 作成に進まない。既に同趣旨の open PR があればそれを案内し新規を乱立しない
   6. ブランチ名: 既定 `feature/issue-<番号>-<要約>`。Cloud Agent 指示で `cursor/...` 等がある場合はそちらを優先

3. **常時ルールは短く**
   - `project-core.mdc` の Git 節に 1〜2 行（`/design` 開始時に main 取り込み済み develop から切る、詳細は `design.md`）
   - `AGENTS.md` の Commands 表または Git 方針に同趣旨の一行
   - 詳細手順の重複維持を避け、正本リンクに寄せる

4. **委任ガイド**
   - `docs/agent-delegation-guide.md` の設計フェーズ説明に「Spec 前に develop↔main ゲート」を一文追加（テンプレ依頼文は任意で更新）

5. **protected develop は仕様として扱う**
   - 本 Issue 着手時に `GH006 Protected branch` で push 拒否を確認済み
   - 「黙って develop push」ではなく sync PR 経由を正式リカバリとする

6. **PR 方針**
   - 設計（本 Spec）と文書実装は同一 PR でよい（ドキュメントのみ・リスク低）
   - マージ先: `develop`
   - #294 は本 PR に含めない。本 Issue マージ（と必要なら develop の main 同期）後に #294 を再開

ステップ
--
1. Spec 3 点を本ブランチに配置（設計フェーズ）
2. 承認後: `design.md` にゲート手順を追加
3. `project-core.mdc` / `AGENTS.md` に短いリマインダ
4. 必要なら `agent-delegation-guide.md` を更新
5. `npm run build` で検証し `develop` 向け PR

検証
--
- `npm run build`
- 文書レビュー: `/design` を上から辿ると、未同期 develop では Spec 作成に到達できないこと
- 実測メモ: push 拒否時停止が手順に明記されていること

リスクとロールバック
--
- ゲートが厳しすぎて設計着手が止まる → sync PR 手順を明示し、停止が「放棄」ではなく「同期待ち」だと分かる文言にする
- 常時ルールと commands の二重管理 → 詳細は `design.md` のみ、他は一行+リンク
- ロールバック: 追加段落の削除で完結
- dirty worktree / 別ブランチ開始時の扱いが曖昧 → `design.md` に「クリーンな状態で fetch。未コミット変更がある場合は停止」を明記
