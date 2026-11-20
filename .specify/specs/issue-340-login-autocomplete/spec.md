# Feature Specification: ログインフォーム autocomplete

**Feature Branch**: `feature/issue-340-login-autocomplete`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: B  
**Input**: Issue #340 / G15

## User Stories

### US1 - パスワードマネージャが動く (P1)

ユーザーID／パスワード欄にブラウザ慣例の `autoComplete` が付き、OTP の既存属性は維持される。

## Requirements

- FR-001: `userId` に `autoComplete="username"`
- FR-002: `password` に `autoComplete="current-password"`
- FR-003: OTP の `autoComplete="one-time-code"` を維持
- FR-004: MFA ポリシー・見た目の大きな改修はしない
