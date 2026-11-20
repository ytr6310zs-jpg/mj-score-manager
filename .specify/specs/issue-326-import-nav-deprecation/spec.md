# Feature Specification: 取り込み導線の本運用化とスコア入力ナビの非推奨明示

**Feature Branch**: `feature/issue-326-import-nav-deprecation`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: B  
**Input**: Issue #326 / Parent #304 / F01, F02 / G06

## User Scenarios

### User Story 1 - PoC 表記を外す (P1)

取り込み CTA・画面タイトルから「PoC」を消し、本運用の登録経路として見せる。

### User Story 2 - スコア入力ナビを降格 (P1)

ヘッダー第一級から外し、非推奨と分かる導線にする。viewer には出さない既存仕様を維持。`/` の機能は触らない。

## Requirements

- FR-001: `/matches`・`/matches/import` のユーザー向け PoC 表現を除去
- FR-002: 編集権限ユーザー向けに取り込みをヘッダー導線に含める（推奨経路）
- FR-003: スコア入力は非推奨としてメニュー等へ降格
- FR-004: 関連 E2E を追従。スコア入力専用 E2E は復活させない

## Success Criteria

- PoC がユーザー向け UI から消える
- スコア入力が主ナビと同格に見えない
