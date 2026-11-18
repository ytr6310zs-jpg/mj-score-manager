---
title: Cursor hooks による機密・worklog ガード
owner: @ytr6310zs-jpg
created: 2026-10-23
---

背景
--
Cursor Agent はシェルとファイル操作を実行できる。`.cursorignore` はインデックス汚染を減らすが、明示的な読み書きや `git add -f` は止めない。当日 worklog の欠落は husky の pre-commit がコミット時点で落とすが、エージェントは失敗してから気づく。

目的
--
エージェント操作の前に、機密ファイルの誤った読み書き・ステージと、worklog のない `git commit` を検知する。既存 husky は人間・エージェント共通の最終ゲートとして残し、Cursor hooks はエージェント向けの事前ガードにする。

受け入れ条件
--
- `.cursor/hooks.json` と `.cursor/hooks/` 配下のスクリプトがリポジトリにあり、プロジェクトフックとして読み込める
- 秘密ファイル（`.env`、`.env*.local`、`*.pem`、秘密鍵ファイル名）をステージまたはコミットしようとするシェルは拒否される
- 同じパスへの Write / StrReplace / Delete は拒否される。`.env.local` への書き込みはユーザー確認（ask）とし、localhost / 127.0.0.1 以外の DB・Supabase ホストを含む内容は拒否する
- 同じパスの Read はユーザー確認（ask）になる
- `git commit` の直前に当日 worklog（`.worklog/logs/YYYY-MM-DD.md` に `### ` エントリ）が無い場合、フックが拒否する。worklog の自動作成や commit の自動実行はしない
- `npm run build` / `npm test` / `npm run lint` / `git status` / `git diff` / `git log` はフックが拒否しない
- フックプロセスの異常終了・不正出力は fail-closed（操作を通さない）
- `AGENTS.md` に hooks の説明と、husky との役割分担がある
- アプリコード、DB、CI ワークフロー、husky スクリプトは変更しない
- 判定ロジックのユニットテストが通り、`npm run build` が成功する（実装フェーズ）

影響範囲
--
- `.cursor/hooks.json`（新規・実装）
- `.cursor/hooks/policy.mjs`（新規・実装。判定の純関数）
- `.cursor/hooks/before-shell.mjs`（新規・実装）
- `.cursor/hooks/pre-tool-use.mjs`（新規・実装）
- `test/cursor-hooks-policy.test.js`（新規・実装）
- `AGENTS.md`（Hooks 節・実装）
- 本ディレクトリの spec / plan / tasks（本設計）

制約
--
- commit / push / PR はユーザー明示依頼時のみ。フックはそれらを代わりに実行しない
- worklog の正本チェックは `scripts/check-worklog.mjs`（日付は UTC の `toISOString` 日付、エントリは `### ` 行）。フックは同じ条件を使い、日付の解釈を変えない
- husky（`.husky/pre-commit`）は変更しない。フックをバイパスした commit の最終防衛は husky のままとする
- `.env.local` の具体値、トークン、リモート URL の実値をテスト・ログ・仕様に書かない
- Issue #279（cursorignore / commands）とは別 PR
- 設計と実装は同一 PR に含める

テスト
--
- ユニット: `test/cursor-hooks-policy.test.js`（`npm run test:unit` に含まれる）。秘密パス、git add/commit 判定、worklog 有無、リモートホスト検知、通常コマンドの allow
- E2E: 対象外
- ビルド: `npm run build`（実装フェーズ）
- 手動: Cursor の Hooks タブでプロジェクトフックが読み込まれること（実装後。UI が使えない場合はスクリプトへ stdin JSON を渡して終了コードと permission を確認する）

参考
--
- Issue #280
- Issue #279（cursorignore。本 Issue では変更しない）
- `scripts/check-worklog.mjs`
- `.husky/pre-commit`
- `.cursor/rules/local-supabase-safety.mdc`
- `.cursor/rules/project-core.mdc`
