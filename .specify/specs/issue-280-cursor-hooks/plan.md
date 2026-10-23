---
title: Issue #280 Cursor hooks — 実装計画
---

概要
--
プロジェクトフックで、秘密ファイルのステージ／書き換えと、worklog のない `git commit` をエージェント実行前に止める。判定は純関数に切り、ユニットテストで固定する。husky は触らない。

Constitution チェック
--
- ドメイン精度: スコア計算・DB に触れない。適合。
- Spec 駆動: 本 3 点を実装の前提にする。適合。
- 機密: ガード追加であり、秘密値は成果物に書かない。適合。
- 品質ゲート: 実装時に対象ユニットテストと `npm run build`。適合。
- 最小差分: hooks、テスト、`AGENTS.md` のみ。husky / CI / アプリは対象外。適合。

設計判断
--
1. **配置**
   - プロジェクトフック `.cursor/hooks.json`（`version: 1`）と `.cursor/hooks/*`
   - ユーザーホームの `~/.cursor/hooks.json` は使わない（リポジトリで共有する）

2. **イベント**
   - `beforeShellExecution`: `git add` / `git commit` だけを検査。それ以外は即 allow
   - `preToolUse`: Read / Write / StrReplace / Delete のパスだけを検査。それ以外は即 allow
   - matcher は付けない。スクリプト側で対象外を即 allow する（matcher の正規表現差でフックが黙って消えるのを避ける）
   - `failClosed: true`
   - `beforeReadFile` は出力フィールドがこのリポジトリの手順書に無いため使わない。Read は `preToolUse` で扱う

3. **秘密パス**
   - 対象: `.env`、`.env.*`（`.env.local`、`.env.production` などを含む）、`*.pem`、ファイル名が `id_rsa` / `id_ed25519` / `credentials.json` / `service-account*.json` のもの
   - パスはリポジトリ相対に正規化して判定する
   - `git add`（`-f` を含む）の引数に上記が含まれる、または `git commit` 時点で `git diff --cached --name-only` に上記が含まれる → `permission: deny`
   - `git commit -a` / `--all` はインデックスだけでは足りない。ワークツリー上の対象パスも見て deny する
   - Write / StrReplace / Delete → `deny`
   - `.env.local` への Write / StrReplace のみ `ask`（local 設定の編集はあり得る）
   - ただし書き込み内容に localhost / 127.0.0.1 以外のホストを指す `SUPABASE_URL` または `DATABASE_URL` がある → `deny`
   - Read → `ask`（コンテキストへの取り込みを黙って通さない）

4. **worklog**
   - `git commit` のときだけ、`scripts/check-worklog.mjs` と同じ条件（UTC 日付、`### ` で始まる行が 1 件以上）を見る
   - 欠ける場合は `deny`。メッセージは `npm run worklog:start` を案内するだけで、フックはファイルを作らない
   - husky pre-commit は全 commit の最終ゲート。フックは Cursor のシェル実行前の案内。二重の役割を `AGENTS.md` に書く

5. **明示 commit 方針との整合**
   - フックは allow / ask / deny だけを返す
   - commit、worklog 起票、push はしない

6. **実装言語**
   - Node（`node:fs` のみ。`jq` に依存しない）
   - 入出力は Cursor フックの JSON（stdin → stdout の `permission` / `user_message` / `agent_message`）
   - 入力キーは実装時に実ペイロードへ合わせる。シェルは `command`、ツールは `tool_name`、パスは `path` / `file_path` / `target_file` のいずれにも耐える。秘密パスだと判定できた操作だけ deny / ask する。判定できない操作は allow し、build や test を止めない。スクリプトの異常終了は `failClosed` が止める
   - 判定は `policy.mjs` に置き、フック入口は薄い

7. **ブランチ**
   - `feature/issue-280-cursor-hooks` を `develop` から作成済み
   - Spec Kit の連番ブランチスクリプトは使わない（本リポジトリの `feature/issue-<番号>-<要約>` を優先）
   - `main` にある #290 は `develop` に無い。本 Issue では取り込まない

ステップ
--
1. 本 Spec 3 点をこのブランチに置く（設計。コミットはユーザー依頼時）
2. `policy.mjs` と `test/cursor-hooks-policy.test.js` を追加し、`npm run test:unit` で判定を固定する
3. `before-shell.mjs` / `pre-tool-use.mjs` / `hooks.json` を追加し、実行権限を付ける
4. `AGENTS.md` に Hooks 節（イベント、fail-closed、husky との分担、worklog は自動起票しないこと）を追記する
5. `npm run test:unit` と `npm run build` を実行する。commit / push / PR は `/pr` 依頼まで待つ

検証
--
- `npm run test:unit`
- `npm run build`
- 手動または stdin 投入: 秘密パスの `git add` が deny、worklog 無しの `git commit` が deny、`npm run build` が allow

リスクとロールバック
--
- fail-closed のため、フックの例外でシェル全体が止まる → 対象外コマンドは判定前に allow し、テストで固定する
- `.env.local` の通常編集が毎回 ask になる → deny にはしない。リモートホストを含む内容だけ deny
- `git diff --cached` をフック内で実行すると遅い、または別フックを誘発する → エージェントの Shell ツール経由では呼ばない（フックスクリプトの子プロセス）。タイムアウトは hooks.json に秒数を書く
- ロールバック: `.cursor/hooks.json` と `.cursor/hooks/` とテストを削除し、`AGENTS.md` の Hooks 節を戻す
