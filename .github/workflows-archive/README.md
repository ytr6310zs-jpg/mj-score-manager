# Archived Workflows

このディレクトリには、現行運用では使用しない GitHub Actions workflow を保管します。

運用方針:
- `.github/workflows/` にあるものだけを現行 workflow として扱う
- archive 済み workflow は GitHub Actions の実行対象ではない
- 必要性が再発した場合のみ、内容確認のうえ `.github/workflows/` へ戻す

2026-04-20 時点の archive 対象:
- `import-historical-common.yml`
- `import-historical-prod.yml`
- `import-historical-staging.yml`
- `migrate-prod.yml`
- `migrate-staging.yml`
- `prod-reset-and-seed-players.yml`
- `staging-reset-and-seed-players.yml`
