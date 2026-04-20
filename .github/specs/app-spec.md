# アプリ仕様（自動生成）

このドキュメントは `.github/copilot-instructions.md` を元に自動生成された、現在のアプリケーション仕様の要約です。

## プロジェクト名
- 麻雀スコア抽出・管理アプリ (mj-score-manager)

## 目的
- 手書きの麻雀スコア表（画像）から、アプリ投入用の正確なマスターデータを抽出・管理する。

## 主要技術
- Database/Auth: Supabase (PostgreSQL)（暫定で Google スプレッドシートを使用）
- Frontend: TypeScript / React (Vite 推奨)
- Logic: TypeScript (Node.js)

## ドメイン知識
- 対応モード: 四人打ち、三人打ち
- スコア体系の拡張性を考慮

## Git & PR 運用ルール
- 自動コミットは許可（ただし機密情報は含めない）
- 自動 push は許可（作業ブランチを作成して行う）
- コミット前に `npm run build` を必須実行。可能なら `npm run lint`/`npm test` も。
- ブランチ戦略: 機能ブランチで実装。粒度に迷ったら相談。
- PR 作成: `gh` CLI を使用。マージ先未指定なら `develop` を使用。

## セキュリティ & 安全性
- 機密情報はコード・ログ・コミットで扱わないこと。
- `.env*` の差分は必ずレビューし、機密値はコミットしない。
- Server Action/API では厳格なバリデーションとエラーハンドリングを行う。
- 認証・認可に関わる変更は PR にリスクを明記する。
- 依存パッケージの追加/更新時は脆弱性チェックを行う。

## 品質管理
- 変更は最小差分で行う。
- 変更前に必要であれば Plan（設計案）を提示し承認を得る。
- コミット前に `npm run build` を実行し、失敗時はコミットしない。

## 必須ファイルと運用フロー
- 必須ファイル: `.github/copilot-instructions.md`
- CI: 必須ファイルの存在をチェックし、欠如時は PR をブロックする。
- ローカル手順:

```bash
npm install
npm run prepare
chmod +x .husky/pre-commit
```

---

*このファイルは自動生成されました。元ファイル: `.github/copilot-instructions.md`*