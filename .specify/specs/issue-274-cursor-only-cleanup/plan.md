---
title: Issue #274 Cursor 専用化 — 実装計画
---

概要
--
必須ファイルを `agent-instructions.md` にリネームし、CI/husky/ドキュメント参照を一括更新する。入口ドキュメントを Cursor 主軸に書き換え、`.github/instructions` / `.github/prompts` を deprecated 明示する。Copilot VS Code 設定を除去する。

設計判断
--
1. **リネーム名**: `.github/agent-instructions.md`（Issue 記載どおり）
2. **中身**: プロジェクト文脈・品質ゲート・Spec Kit・worklog は維持。Git の自動 commit/push/PR 許可は削除し、Cursor 方針（明示依頼時のみ）に合わせる。詳細のパス別規約は `.cursor/rules/` へ誘導
3. **`.github/instructions/`**: 削除せず `README.md` で deprecated + 正本リンク。symlink/生成スクリプトは本 Issue では採用しない（最小差分）
4. **`.github/prompts/`**: 同様に README で非推奨明示（削除しない）
5. **`.github/agents/`**: 維持。参照パスのみ必要なら更新
6. **Spec Kit `integration`**: `init-options.json` / `integration.json` の `integration: "copilot"` は CLI 互換のため維持。`context_file` のみ `agent-instructions.md` に更新
7. **過去 Spec の参照文字列**: 書き換え対象外（ノイズ回避）

ステップ
--
1. `copilot-instructions.md` を `agent-instructions.md` へ `git mv` し、冒頭と Git 節を Cursor 整合に更新
2. CI / husky / package.json / PR テンプレ / constitution / init-options / app-spec / skills / plan agent の参照を更新
3. `AGENTS.md` / README / agent-delegation-guide / issue-prompt-guidelines を Cursor 専用入口に書き換え
4. `.github/instructions/README.md` と `.github/prompts/README.md` を追加
5. `.vscode/settings.json` から `github.copilot.*` を削除
6. `npm run check:required-files` と `npm run build` で検証

検証
--
- `npm run check:required-files`
- `npm run build`
- 必要なら `npm run lint`

リスクとロールバック
--
- 必須ファイル名変更で CI が一時失敗する可能性 → 同一コミットで全参照を更新
- Spec Kit CLI が旧 `context_file` を期待する場合 → `init-options` を新パスに更新済みであることを確認
- ロールバック: `agent-instructions.md` を旧名に戻し参照を revert
