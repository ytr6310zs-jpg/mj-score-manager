---
title: Issue #280 Cursor hooks — タスク
---

- T1: Spec 配置 — Done 条件: `.specify/specs/issue-280-cursor-hooks/` に spec.md / plan.md / tasks.md がある
- T2: 判定ロジック — Done 条件: `.cursor/hooks/policy.mjs` が秘密パス、git add/commit、worklog 有無、リモートホスト、通常コマンド allow を純粋関数で返す
- T3: ユニットテスト — Done 条件: `test/cursor-hooks-policy.test.js` が上記をカバーし、`npm run test:unit` が成功する
- T4: シェルフック — Done 条件: `.cursor/hooks/before-shell.mjs` が stdin JSON を読み、`git add` / `git commit` 以外は allow、危険時は deny JSON を返す。実行権限がある
- T5: ツールフック — Done 条件: `.cursor/hooks/pre-tool-use.mjs` が Read を ask、秘密パスの Write/StrReplace/Delete を deny、`.env.local` のローカル書き込みを ask、リモートホストを含む `.env.local` 書き込みを deny する
- T6: 登録 — Done 条件: `.cursor/hooks.json` が version 1 で両コマンドを `failClosed: true` で登録し、matcher を持たない
- T7: 文書 — Done 条件: `AGENTS.md` に Hooks 節があり、husky が commit 時の最終ゲート、フックはエージェント事前ガードで worklog を自動作成しない、と書いてある
- T8: 検証 — Done 条件: `npm run test:unit` と `npm run build` が成功する。commit / push / PR はユーザーの `/pr` まで行わない
