# Implementation Plan: フィルタ状態共有

**Branch**: `feature/issue-239-filter-state-sharing` | **Date**: 2026-05-08  
**Spec**: `.specify/specs/239-filter-state-sharing/spec.md`  
**Issue**: #239

---

## Summary

対局履歴・成績集計・相性表で使うフィルタ状態を `localStorage` に保存し、ページ間遷移とスコア入力画面往復の両方で再利用できるようにする。  
Server Component が検索条件を `searchParams` から確定しているため、保存だけでなく「URL 未指定時に保存値を URL へ反映するクライアントブリッジ」を追加する。

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20  
**Framework**: Next.js 15 App Router  
**Primary Dependencies**: React, Next Navigation, Tailwind CSS  
**Storage**: Browser localStorage  
**Testing**: `npm run build`, `npm test`, 必要に応じて Playwright/manual  
**Target Platform**: Web  
**Constraints**: 既存の `resolveFilterParams` と `DateRangeFilter` を活かし、URL 互換を壊さないこと

---

## Current State

### 1. フィルタ計算

- `lib/filter-params.ts` が `filter`, `start`, `end`, `minGames`, `tournamentId` を URL から正規化している
- 対局履歴・成績集計・相性表の各ページは Server Component であり、検索条件を `searchParams` から直接解決している

### 2. 保存済み状態

- 大会のみ `lib/tournament-preference.ts` で `localStorage` に保存される
- 日付・期間・試合数は保存されず、画面間で共有されない
- スコア入力画面は大会保持のみ利用している

### 3. 制御上の課題

`localStorage` はサーバー描画時に読めないため、単に保存するだけでは `/matches` や `/stats` を URL パラメータなしで開いたときに復元できない。  
このため、保存状態の読取と URL への反映をクライアントで担う専用コンポーネントが必要になる。

---

## Architecture

### A. 共有状態ヘルパー

新規 `lib/filter-state-preference.ts` を追加し、以下を提供する。

```ts
export type SharedFilterState = {
  filter: string;
  start: string;
  end: string;
  tournamentId?: string;
  minGames?: string;
};

export function readSharedFilterState(): SharedFilterState | null;
export function writeSharedFilterState(state: SharedFilterState): void;
export function clearSharedFilterState(): void;
export function normalizeSharedFilterState(raw: unknown): SharedFilterState | null;
export function buildSharedFilterSearchParams(
  state: SharedFilterState,
  options: { includeMinGames: boolean }
): URLSearchParams;
```

役割:

- 不正 JSON や欠損値を無効扱いにする
- `custom` フィルタ時の `start/end` 必須制約を吸収する
- 対局履歴向けに `minGames` を除外した検索文字列を構築する

### B. URL 復元ブリッジ

新規 `components/filter-state-sync.tsx` を追加し、各フィルタページに配置する。

役割:

1. 現在の URL にフィルタ系パラメータがある場合は、その値を保存状態へ同期する
2. URL にフィルタ系パラメータがない場合のみ、保存状態を読んで `router.replace()` で同一ページへ反映する
3. 反映対象はページごとの capability で切り替える

explicit 判定ルール:

- 共通: `filter`, `mode`, `start`, `end`, `tournamentId` のいずれかがあれば explicit
- `stats`, `compatibility` のみ: `minGames` 単独でも explicit
- `matches` は `minGames` を explicit 判定に含めない

想定 props:

```tsx
type FilterStateSyncProps = {
  pathname: "/matches" | "/stats" | "/compatibility";
  includeMinGames: boolean;
  currentState?: {
    filter: string;
    start: string;
    end: string;
    tournamentId?: string;
    minGames?: string;
  };
  hasExplicitSearchParams: boolean;
};
```

### C. DateRangeFilter からの保存

`components/date-range-filter.tsx` はすでにフィルタの最終決定点なので、ここで共有状態を保存する。

保存タイミング:

- フィルタ選択変更で即時送信する直前
- 大会変更時
- 試合数変更で即時送信する直前
- カスタム期間のフォーム submit 時

注意点:

- 対局履歴では `showMinGames={false}` なので `minGames` を消さず上書きしない方針にする
- 既存の `setLastTournamentId()` 呼び出しは維持し、大会保持との後方互換を残す

### C-2. スコア入力画面での大会同期

`components/score-form.tsx` で大会選択が変更された際は、既存の `setLastTournamentId()` に加えて共有フィルタ状態の `tournamentId` を更新する。  
共有フィルタ状態そのものが未保存なら新規作成はせず、既存状態がある場合のみ `tournamentId` を差し替える。

### D. AppHeader の遷移改善

`components/app-header.tsx` の各フィルタページリンクで、保存済み共有状態があればリンク先 URL に付与する。  
これにより、ヘッダー遷移直後からサーバー描画に同じ条件を渡せる。

方針:

- `matches`, `stats`, `compatibility` の 3 リンクのみ対象
- `input` は現在どおり `/` 固定
- 保存状態がなければ素の URL を使う
- 対局履歴向けリンクでは `minGames` を除外する

---

## File-Level Plan

### 1. `lib/filter-state-preference.ts` を新規追加

- `localStorage` キー定義
- 読み書き関数
- 型ガードと正規化
- 検索パラメータ生成

### 2. `components/filter-state-sync.tsx` を新規追加

- `useEffect` で URL と保存状態を比較
- 明示パラメータなしのときだけ `router.replace()`
- 一度反映したら同一描画中に再反映しないようガード

### 3. `components/date-range-filter.tsx`

- 現在の state から共有フィルタ状態を書き込む補助関数を追加
- `handleFilterChange`, `handleMinGamesChange`, `handleTournamentChange`, `handleSubmit` に組み込む
- `showMinGames` に応じて `minGames` の保存方針を分ける

### 4. `components/app-header.tsx`

- 保存済み共有状態からリンク先 href を構築する helper を追加
- 既存の loading state や current 判定は維持する
- スコア入力からフィルタページへ戻る導線でも同じ shared state を参照する

### 5. 各ページ

対象:

- `app/matches/page.tsx`
- `app/stats/page.tsx`
- `app/compatibility/page.tsx`

対応内容:

- `FilterStateSync` をヘッダー近傍に配置
- 現在ページの正規化済み state を props で渡す
- `hasExplicitSearchParams` を判定するため、対象パラメータの有無を計算する

---

## Validation Strategy

### 自動確認

1. `npm run build`
2. `npm test`
3. 必要に応じて `npm run lint`
4. 共有状態 helper の単体テストで old URL 互換と explicit 判定を確認する

### 手動確認

1. `/stats` で大会・年次・試合数を変更し、ヘッダーから `/matches` と `/compatibility` へ移動
2. `/compatibility` でカスタム期間を指定し、`/` を挟んで `/stats` に戻る
3. `localStorage` の共有キーを壊した値にして各ページを開く
4. `?mode=thisYear` など旧 URL で開き、正規化後に共有状態が更新されることを確認
5. スコア入力で大会を変更し、`/stats` または `/matches` に戻ったとき shared state の tournamentId も更新されることを確認

---

## Risks and Mitigations

| リスク | 対策 |
|---|---|
| URL 復元処理が無限リダイレクトする | `hasExplicitSearchParams` と一度だけの `replace` ガードを入れる |
| 対局履歴で `minGames` を誤適用する | ページ capability で `includeMinGames` を分離する |
| 大会保持が二重管理になり不整合が出る | 共有状態保存時に `setLastTournamentId` も同時更新し、既存キーとの同期を保つ |
| 直リンク時に一瞬既定値が見える | 初回復元はクライアント処理のため許容しつつ、ヘッダー遷移では保存済み URL を直接使って体感差を抑える |

許容 UX:

- URL なし直リンク時、client bridge による 1 回の `replace` 発生は許容する
- ただしローディングループや連続 replace は不可とし、1 navigation あたり 1 回までに制限する

---

## Out of Scope

- サーバーセッションや cookie を用いたフィルタ同期
- スコア入力画面自体へのフィルタ UI 追加
- 新しいフィルタ項目の追加
- 他画面（印刷画面、CSV/PDF 出力画面など）への共有状態拡張