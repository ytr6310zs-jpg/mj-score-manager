# UX Findings Catalog — Issue #304

**Created**: 2026-11-20  
**Updated**: 2026-11-20（一般プラクティスチェックリスト再点検）  
**Method**: コードレビュー＋ローカル実操作＋[`docs/ux-practice-checklist.md`](../../../docs/ux-practice-checklist.md)（G01–G15）  
**Status legend**: `open` / `linked` / `done` / `wontfix` / `out-of-scope`

## Summary

| ID | 深刻度 | 画面 | 要約 | G | 振分 | 状態 |
|---|---|---|---|---|---|---|
| F01 | P1 | ナビ／取り込み | 主登録経路なのに「PoC」表記が残る | G06 | [#326](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/326) | linked |
| F02 | P1 | ナビ | deprecate の「スコア入力」が通常ナビと同格 | G06 | [#326](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/326) | linked |
| F03 | P1 | import／admin／edit | 権限不足時に黙って `/matches` へ redirect | G04 | [#327](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/327) | linked |
| F04 | P2 | matches／edit | 編集 URL が `createdAt`（衝突リスク） | — | #261 | linked |
| F05 | P2 | matches | 一覧にページネーションなし | — | #31 | linked |
| F06 | P2 | stats/print | 印刷が履歴同様でページ過多 | — | #268 | linked |
| F07 | P2 | 削除系 | `window.confirm`（確認はある／インページ化は改善） | G09 | [#336](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/336) | linked |
| F08 | P2 | login/admin | document title / metadata 不足 | G12 | [#337](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/337) | linked |
| F09 | P3 | admin | 管理トップがテキストリンクのみ | NAV | #337 に含めて検討可 | linked |
| F10 | — | `/` | 非致命 UX | — | #305 | out-of-scope |
| F11 | — | header | メニュー a11y／E2E settle | G11 | #310 | done |
| F12 | P1 | stats | フィルタ 0 件なのに「データなし」文言 | G05,G13 | [#328](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/328) | linked |
| F13 | P1 | stats | 空状態が「スコアを入力」を勧める（#305 と矛盾） | G06 | [#328](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/328) | linked |
| F14 | — | `/` | Application error（再起動後は再現せず） | — | 環境起因 | wontfix |
| F15 | P2 | matches | mobile/desktop 二重 DOM で a11y 重複 | G11 | [#332](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/332) | linked |
| F16 | P2 | import | プレビューの待ち・失敗が分かりにくい | G02,G03 | [#329](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/329) | linked |
| F17 | P1 | stats／compatibility | minGames「条件なし」が共有フィルタに押し戻される | G07 | [#328](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/328) | linked |
| F18 | P2 | edit | スコア spinbutton の accessible name がスロット区別弱い | G11 | [#335](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/335) | linked |
| F19 | P2 | header | navigatingTo でリンクが一時無効化されやすい | G02,G10 | [#333](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/333) | linked |
| F20 | P2 | flash | エラー flash も成功色（緑） | G03 | [#330](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/330) | linked |
| F21 | P2 | CSV/PDF | 出力の進捗・失敗が画面上で分からない | G02 | [#331](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/331) | linked |
| F22 | P2 | edit | キャンセルが `history.back()` | G08 | [#334](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/334) | linked |
| F23 | P2 | edit | 成功 Alert（編集画面）＋自動遷移＋flash の二重 | G01 | [#338](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/338) | linked |
| F24 | P3 | 全体 | `error.tsx` / `not-found.tsx` なし | G14 | [#339](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/339) | linked |
| F25 | P3 | login | userId/password の autocomplete 不足 | G15 | [#340](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/340) | linked |
| F26 | P2 | admin CRUD | 成功無言・追加エラー非表示・pending/ラベル弱い | G01–G03,G10,G11 | [#341](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/341) | linked |

---

## Checklist pass（再点検 2026-11-20）

| G | 結果 | メモ |
|---|---|---|
| G01 | **Fail** | 対局編集の二重 FB（F23→#338）。admin CRUD は滞在型だが成功が無言（F26→#341）。取り込み確定は滞在型で概ね一貫 |
| G02 | Partial | 編集送信・ログインは pending あり。プレビュー待ち弱い（#329）。CSV/PDF 弱い（#331）。ヘッダーは ADR 意図あり／ロック過強（#333） |
| G03 | Fail | flash 成功色固定（#330）。フォームエラーは概ね destructive |
| G04 | Fail | silent redirect（#327） |
| G05 | Fail | stats 空状態（#328）。compatibility もフィルタ 0 件文言が曖昧 → #328 に含める |
| G06 | Fail | PoC／スコア入力ナビ（#326）。stats CTA（#328） |
| G07 | Fail | minGames 押し戻し（#328） |
| G08 | Fail | 編集キャンセル history.back（#334） |
| G09 | Pass* | confirm あり。*インページ化は改善（#336） |
| G10 | Partial | 送信 disabled は概ね OK。ナビロック（#333） |
| G11 | Partial | #310 done。二重 DOM（#332）、スコアラベル（#335）残 |
| G12 | Partial | matches/stats/compat/import/edit は title あり。login/admin 不足（#337） |
| G13 | Fail | 履歴あり × 成績「データなし」（#328） |
| G14 | Fail | error/not-found なし（#339） |
| G15 | Fail | login autocomplete（#340）。OTP は OK |

---

## サブ Issue 妥当性レビュー（再点検）

| Issue | 判定 | メモ |
|---|---|---|
| #326 | 適切 | G06。PoC 除去＋ deprecate ナビ明示 |
| #327 | 適切 | G04 |
| #328 | 適切（範囲拡張推奨） | stats に加え **compatibility** の minGames／空状態も同根。P1 維持 |
| #329 | 適切 | G02/G03 |
| #330 | 適切 | G03 |
| #331 | 適切 | G02 |
| #332 | 適切 | G11 |
| #333 | 適切 | フィードバック削除ではなくロック緩和。ADR 0009/0019 と矛盾しない |
| #334 | 適切 | G08 |
| #335 | 要スコープ修正 | **編集のみ**。`/` スコア入力は #305 で非対象（本文から外す） |
| #336 | 適切（P2 改善） | G09 は現状「確認あり」で合格寄り。親 P1 必須にしない |
| #337 | 適切 | G12。F09 同居は任意 |
| #338 | 新規・適切 | G01 遷移型。合意済み方針 |
| #339 | 新規・適切 | G14・P3 |
| #340 | 新規・適切 | G15・P3 |

※ 再点検メモは GitHub 上にも反映済み（#304 / #328 / #333 / #335 / #336）。#335 本文は編集フォームのみに更新済み。

---

## Findings（詳細）

### F01 — 一括取り込みが「PoC」のまま（P1）

- **画面**: `/matches` CTA、`/matches/import` の CardTitle
- **現象**: 「一括インポート（PoC）」「スプレッドシート一括インポート（PoC）」
- **期待**: 本運用の主登録経路として PoC 表現を外す
- **振分**: [#326](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/326)

### F02 — ヘッダーでスコア入力が第一級ナビ（P1）

- **振分**: [#326](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/326)

### F03 — 権限不足の silent redirect（P1）

- **振分**: [#327](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/327)

### F04 — 編集 URL が createdAt（P2）

- **振分**: [#261](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/261)

### F05 — 対局履歴ページネーションなし（P2）

- **振分**: [#31](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/31)

### F06 — 印刷レイアウト（P2）

- **振分**: [#268](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/268)

### F07 — ネイティブ confirm（P2 改善）

- **振分**: [#336](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/336)

### F08 / F09 — metadata／管理トップ（P2/P3）

- **振分**: [#337](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/337)

### F10 — スコア入力 UI（out-of-scope）

- #305。積極改修しない。

### F11 — ヘッダー／E2E（done）

- [#310](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/310)

### F12 / F13 / F17 — 成績・相性の空状態と共有フィルタ（P1）

- stats に加え compatibility も `includeMinGames={true}`
- **振分**: [#328](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/328)

### F14 — `/` Application error（wontfix）

- 再起動後再現せず。

### F15–F22

- #332 / #329 / #335 / #333 / #330 / #331 / #334（上表）

### F23 — 編集成功の二重フィードバック（P2）→ #338

- **現象**: 編集画面に成功 Alert → 遅延遷移 → 履歴 flash
- **期待**: 遷移型（編集画面はエラーのみ、成功は flash のみ）
- **根拠**: `match-edit-form.tsx` + `match-actions.ts`

### F24 — error / not-found なし（P3）→ #339

### F25 — ログイン autocomplete（P3）→ #340

- 追記: ユーザー管理の password 欄も #340 で扱ってよい

### F26 — 管理画面 CRUD フィードバック（P2）→ #341

- **初回パスでは不足**（metadata / confirm / 権限のみ）
- 成功無言、player/yakuman 追加のエラー非表示、pending disabled 不足、役満行編集失敗が画面に出ない、placeholder のみラベル

---

## 画面チェックメモ

| 画面 | 空状態 | エラー | 権限 | ナビ | 破壊的操作 | 備考 |
|---|---|---|---|---|---|---|
| `/login` | OK | エラー文言あり | — | — | — | metadata・autocomplete（F08/F25） |
| `/matches` | 取込誘導あり | error 表示 | edit CTA 分岐 | ヘッダー | confirm 削除 | PoC (F01) |
| `/matches/import` | フォーム | 検証メッセージ | silent redirect | 戻るリンク | — | PoC／プレビュー FB（F16）。確定は滞在型で G01 合格寄り |
| `.../edit` | — | フォーム | middleware | キャンセル back | — | F18・F22・F23・#261 |
| `/stats`・print | フィルタ依存 | — | 認証 | OK | — | F12–F13／F17／#268 |
| `/compatibility` | 期間文言のみ | — | 認証 | OK | — | F17 同根 |
| `/admin*` | リンク一覧 | — | middleware | OK | confirm | F08/F09 |
| `/` | — | — | viewer redirect | ナビ残存 | — | F10／F02 |

### 手動操作ログ（2026-11-20）

- 環境: `http://localhost:3000`（`next start`）、admin
- 通過: login → matches → import → stats → admin → edit
- `/` : 再起動後正常（F14 wontfix）
- 編集成功の二重 FB はコード＋利用者報告で確認（F23）

---

## Parent close checklist

- [x] カタログ作成（本ファイル）
- [x] 一般プラクティスチェックリスト（`docs/ux-practice-checklist.md`）
- [x] P1 サブ Issue 化（#326 / #327 / #328）
- [ ] P1 完了または見送り（#326 / #327 / #328）
- [x] P2 既存 Issue 振分（#261 / #31 / #268）
- [x] P2/P3 新規 Issue 化（#329–#341）
- [x] admin CRUD 編集の再点検（F26）
- [x] F14 再確認済み（再現せず）
- [x] チェックリスト再点検＋サブ妥当性レビュー
