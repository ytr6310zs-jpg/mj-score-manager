# ADR 0005: local 開発では local Supabase を標準DBとする

日付: 2026-04-03
ステータス: proposed
作成者: プロジェクト（個人開発）

## 背景
現状の課題は、local 開発時に staging 環境の DB を参照しうることにある。これにより、開発中の誤更新、検証データの汚染、環境依存の不具合見落としが発生しうる。

一方で、アプリ本体は Supabase SDK を前提とした実装が多く、local 開発だけを direct PostgreSQL 接続へ切り替えると変更範囲が広くなる。Issue #52 の本質は「local では staging DB を使わないこと」であり、local DB の実体を PostgreSQL 直結に限定する必要はない。

## 決定
- local 開発の標準DBは local Supabase とする。
- local 開発時は local Supabase の URL / key のみを利用し、staging / production の接続情報は使わない。
- スキーマの正本は引き続き `supabase/migrations/` とする。
- local 開発手順として、local Supabase の起動、環境変数設定、`npx supabase@2.84.2 db reset` による migration 適用、seed 投入、アプリ起動を定義する。
- Supabase CLI は `npx supabase@2.84.2 ...` の固定バージョンで実行する。
- local 手順では `node-pg-migrate` 経路（`npm run migrate:up` 等）を利用しない。
- direct PostgreSQL への全面移行は今回のスコープ外とし、必要になれば別 Issue で再評価する。

## 理由
- 既存の Supabase SDK 前提実装との整合性が高く、アプリコードの変更量を抑えられる。
- production に近い前提で local 検証ができる。
- Issue #52 の主目的である「local で staging DB を見ない」を最短で満たせる。
- 将来、direct PostgreSQL への移行が必要になっても今回の決定と矛盾しない。

## 代替案
- staging DB を継続利用する。
  - Issue #52 の問題を解決しないため不採用。
- local 開発だけ direct PostgreSQL に切り替える。
  - 将来的な選択肢としては有効だが、現状の Supabase SDK 前提実装との乖離が大きく、今回の最短解ではないため不採用。
- local Supabase と direct PostgreSQL を両対応にする。
  - 柔軟だが、初手としては設計と運用が複雑化しすぎるため不採用。

## 影響・運用
- `README.md` に local Supabase を前提とした開発手順を追加する。
- `.env.example` に local 用の Supabase 設定例と注意事項を追加する。
- `.github/MIGRATIONS.md` に local / staging / production の役割分離を追記する。
- local で利用する seed データと migration 手順は、staging を参照せず完結するように整理する。
- 本 ADR は `proposed` としてレビューし、合意後に確定扱いとする。

## 次のアクション
1. local Supabase の起動手順を README に詳細化する。
2. `.env.local` に必要な local 用値を取得・設定する手順を整備する。
3. `supabase/migrations/` を local へ適用する手順を明文化する。
4. local seed の投入方法を整理し、staging 参照が不要であることを確認する。
5. local 起動、主要画面表示、`npm run build` を検証項目として固定する。

## 実装担当向け cleanup チェックリスト
1. CI の migration 実行経路を `supabase db push` に統一する。
2. local 手順から `node-pg-migrate` 前提を除外する。
3. 暫定回避用スクリプト（`scripts/reset-local-db.mjs`, `scripts/seed-to-db.mjs`）を削除する。
4. `migrations/` の参照が残っていないことを確認してからアーカイブ/削除を判断する。

## 実装タスクリスト（引き継ぎ用）

完了済み:
- [x] `supabase/config.toml` 方針を決定（`npx supabase init` 前提 + `supabase/config.toml.example` を補助として追加）。
- [x] local Supabase 起動手順を README に統合。
- [x] `.env.example` / `.env.local` の local 向け期待値を整理。
- [x] staging / production 用の接続情報を local 手順から排除する方針をドキュメントへ反映。
- [x] local Supabase 起動後の疎通確認手順（`/`, `/matches`, `/stats`, `/admin`）を定義（`scripts/local-healthcheck.mjs`, `npm run check:local-pages`）。
- [x] `npm run build` を最終確認項目として README に固定。

残作業（実装担当）:
- [x] `.github/MIGRATIONS.md` に local 向けの具体コマンド手順を追加（ローカル向け手順を `.github/MIGRATIONS.md` に追加済み）。
- [x] local seed の投入手順を README で明示的に固定（`npm run seeds` を `scripts/seed-to-supabase.mjs` に紐付け、README に手順を追加済み）。

実装状況:
- 実装は `feature/issue-52` ブランチ上で完了しています（主要コミット: `9847b35`, 現在の HEAD: `d05b9f1`）。
- `README.md`, `.github/MIGRATIONS.md`, `package.json`, `scripts/check-local-supabase.mjs`, `scripts/local-healthcheck.mjs`, `supabase/config.toml.example` を含む変更を反映済み。

受け渡しメモ:
- 追加済みスクリプト: `check:local-db`, `dev:local`, `check:local-pages`。
- local DB ガード: `scripts/check-local-supabase.mjs`。
- 疎通確認: `scripts/local-healthcheck.mjs`。

*** End ADR