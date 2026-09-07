---
title: Issue #279 .cursorignore / commands — 実装計画
---

概要
--
同一 PR で Spec 3 点と実装（`.cursorignore`・3 commands・`AGENTS.md` 追記）をまとめる。#280（hooks）とは別 PR。

設計判断
--
1. **`.cursorignore` の方針**
   - `.gitignore` の生成物をベースに、Cursor 向けに明示列挙
   - 必須候補: `node_modules/`, `.next/`, `out/`, `build/`, `coverage/`, `playwright-report/`, `.worklog/`, `.vercel/`, `data-output/`, `supabase/.branches/`, `supabase/.temp/`, `*.tsbuildinfo`, `.env`, `.env*.local`, `*.pem`
   - データ系: `scripts/mahjong-data/**/*.csv`
   - ソース（`app/`, `components/`, `lib/`, `test/`）は除外しない

2. **commands の中身**
   - `/clarify` ← Issue 確認（GitHub MCP）
   - `/design` ← Spec 3点作成、自己レビュー、実装禁止、停止
   - `/implement` ← 設計3点確認、worklog、tasks 順実装、build、commit/push/PR は依頼待ち
   - `/pr` ← 実装後の commit → push → PR（呼び出し自体が明示依頼。ベース `develop`）
   - 文言は `docs/agent-delegation-guide.md` を正とし、旧「自動コミット可」は入れない

3. **ファイル配置**
   - `.cursor/commands/clarify.md` / `design.md` / `implement.md`

4. **AGENTS.md**
   - `## Commands` 節とディレクトリツリーに `commands/` を追記

5. **PR 方針**
   - #279 は設計+実装を **1 PR** に含める
   - #280 は別 PR（別ブランチ）

ステップ
--
1. Spec 3 点を配置（本ブランチ）
2. `.cursorignore` を作成
3. `.cursor/commands/{clarify,design,implement}.md` を作成
4. `AGENTS.md` を更新
5. `npm run build` で検証し `develop` 向け PR を作成

検証
--
- `npm run build`
- 手動: Cursor Agent で `/design` が候補に出ること

リスクとロールバック
--
- cursorignore の過剰除外で必要なソースが読めなくなる → ソースディレクトリは除外しない
- commands と skills の重複混乱 → commands から skills / docs へリンクし、ロジックは複製しない
- ロールバック: 追加ファイル削除で完結
