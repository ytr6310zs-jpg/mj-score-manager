---
title: Cursor .cursorignore と /commands の追加
owner: @ytr6310zs-jpg
created: 2026-09-07
---

背景
--
Cursor Agent のコンテキストに `node_modules` / `.next` / 生成物・大きなデータが混入すると、回答品質とトークン効率が落ちる。また Clarify / Design / Implement の定型プロンプトは `docs/issue-prompt-guidelines.md` にあるが、毎回コピペが必要で、Cursor の `/commands` に載せていない。

目的
--
1. `.cursorignore` でインデックス・コンテキスト汚染を減らす  
2. `.cursor/commands/` に `/clarify` `/design` `/implement` `/pr` を追加し、既存委任テンプレと整合した定型フローを一発起動できるようにする  
3. `AGENTS.md` に使い方を追記する（実装フェーズ）

受け入れ条件
--
- `.cursorignore` が存在し、少なくとも `node_modules` / `.next` / coverage / playwright-report / `.worklog` / 大きな seed・CSV 系が除外対象に含まれる
- `.cursor/commands/clarify.md` / `design.md` / `implement.md` / `pr.md` が存在し、Agent 入力から呼び出せる内容になっている
- commands の制約が現行ルールと一致する（設計停止、`/implement` は commit しない、`/pr` の呼び出しが git 明示依頼）
- `AGENTS.md` に Commands 節がある（実装フェーズ）
- アプリコード・DB・CI 必須ファイル名を変更しない
- `npm run build` 成功（実装フェーズ）

影響範囲
--
- `.cursorignore`（新規・実装）
- `.cursor/commands/clarify.md`（新規・実装）
- `.cursor/commands/design.md`（新規・実装）
- `.cursor/commands/implement.md`（新規・実装）
- `.cursor/commands/pr.md`（新規・実装）
- `AGENTS.md`（Commands 節追記・実装）
- 本ディレクトリの spec/plan/tasks（本設計 PR）

制約
--
- `.gitignore` と役割が異なる（git 追跡除外 vs Cursor インデックス除外）。`.env*.local` は gitignore 済みでも、誤ってコンテキストに載らないよう cursorignore にも含める
- commands は skills（runbook / spec-kit-workflow）を置き換えず、呼び出す・誘導する薄いラッパーとする
- `/implement` は「設計承認済み」前提。未承認なら停止する旨を明記
- `/implement` は commit/push/PR を自動実行しない（ユーザー明示依頼まで待つ）— `docs/issue-prompt-guidelines.md` の旧 Copilot 向け自動コミット文言は踏襲しない
- Issue #280（hooks）とは別 PR。本 Issue では hooks を追加しない
- 設計と実装は **同一 PR** に含める（#279 と #280 を別 PR にする）

テスト
--
- ユニット: 対象外
- ビルド: `npm run build`（実装フェーズ）
- 手動: Cursor で `/design` が表示・実行できること（実装後）

参考
--
- Issue #279
- Issue #280（hooks・別PR）
- `docs/issue-prompt-guidelines.md`
- `docs/agent-delegation-guide.md`
- `.cursor/skills/spec-kit-workflow/SKILL.md`
- `.cursor/skills/issue-implementation-runbook/SKILL.md`
