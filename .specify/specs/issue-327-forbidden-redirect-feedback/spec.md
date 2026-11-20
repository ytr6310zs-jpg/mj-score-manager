# Feature Specification: 権限不足時の silent redirect フィードバック

**Feature Branch**: `feature/issue-327-forbidden-redirect-feedback`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: C（トリアージ合意済み）  
**Input**: Issue #327 / Parent #304 / F03 / Checklist G04

## Clarifications

| ID | 決定 |
|---|---|
| D1 | フィードバック手段は既存 `FlashMessage`（`?flash=`）を拡張する |
| D2 | flash キーは `forbidden`（文言: 権限がない旨）。許可ロール自体は変更しない |
| D3 | viewer の `/` 拒否も同様に flash 付きで `/matches` へ（現状 silent） |
| D4 | 未ログインの `/login` への redirect は本 Issue 対象外（権限不足ではなく未認証） |
| D5 | `forbidden` 表示は成功（緑／✓）と区別できる最低限の見た目にする。`invalidDate` 等の全面トーン整備は #330 に寄せてよい |

## User Scenarios & Testing

### User Story 1 - 権限不足で拒否された理由が分かる (Priority: P1)

viewer（または editor の admin 拒否）が保護 URL にアクセスしたとき、`/matches` へ戻されると同時に「権限がない」ことが分かる。

**Acceptance Scenarios**:

1. **Given** viewer セッション, **When** `/admin` を開く, **Then** `/matches` に着地し権限不足の flash が見える
2. **Given** viewer セッション, **When** 対局編集 URL を開く, **Then** 同上
3. **Given** viewer セッション, **When** `/` を開く, **Then** `/matches` に着地し権限不足の flash が見える
4. **Given** viewer（または非 editor）セッション, **When** `/matches/import` を開く, **Then** `/matches` に着地し権限不足の flash が見える
5. **Given** admin / editor の既存許可パス, **When** 従来どおりアクセスする, **Then** 拒否されない（許可範囲不変）

### User Story 2 - 拒否 flash が成功に見えない (Priority: P2)

**Acceptance Scenarios**:

1. **Given** `flash=forbidden`, **When** FlashMessage を表示する, **Then** 成功（更新・削除）と同じ緑✓だけには見えない

## Requirements

- **FR-001**: middleware の権限不足 redirect（`/` viewer、`/admin` 非 admin、edit viewer）は `/matches?flash=forbidden`（同等可）とする
- **FR-002**: import ページの権限不足 `redirect` も同様に flash 付きとする
- **FR-003**: `FlashMessage` に `forbidden` メッセージを追加する
- **FR-004**: ロール許可マトリクスは変更しない
- **FR-005**: 未ログイン → `/login` は現状維持（本 Issue 外）

## Success Criteria

- **SC-001**: 対象の権限不足アクセスで silent redirect にならない
- **SC-002**: admin/editor の許可操作が壊れていない

## Out of Scope

- 権限モデル変更、schema、スコア入力 UI
- flash 全種別のデザイン刷新（#330）— ただし `forbidden` の最低限区別は本 Issue に含む（D5）
