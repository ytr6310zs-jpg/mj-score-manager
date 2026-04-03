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
- local 開発手順として、local Supabase の起動、環境変数設定、migration 適用、seed 投入、アプリ起動を定義する。
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

## 実装タスクリスト
- [ ] `supabase/config.toml` をリポジトリ管理するか、初回 `npx supabase init` 前提にするかを決める。
- [ ] local Supabase 起動手順を README のセットアップ章に統合する。
- [ ] `.env.example` と `.env.local` の期待値を local 向けに整理する。
- [ ] local 用 migration 適用手順を `.github/MIGRATIONS.md` へ具体化する。
- [ ] local seed の投入元と実行手順を定義する。
- [ ] staging / production 用の接続情報を local 手順から完全に排除する。
- [ ] local Supabase 起動後の疎通確認手順（`/`, `/matches`, `/stats`, `/admin`）を定義する。
- [ ] `npm run build` を最終確認項目として固定する。

*** End ADR