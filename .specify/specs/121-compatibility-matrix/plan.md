# Implementation Plan: 相性表（プレーヤー間戦績マトリクス）

**Branch**: `feature/issue-121-compatibility-matrix` | **Date**: 2026-05-08  
**Spec**: `.specify/specs/121-compatibility-matrix/spec.md`  
**Issue**: #121

---

## Summary

プレーヤー間の対戦戦績（勝・負・分け・勝率）を N×N マトリクスで閲覧できる新規ページ `/compatibility` を追加する。  
既存の `fetchMatchResults` / `DateRangeFilter` コンポーネントを最大限再利用し、最小差分で実装する。

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20  
**Framework**: Next.js 15 App Router (Server Components)  
**Primary Dependencies**: Supabase JS Client, Tailwind CSS, shadcn/ui  
**Storage**: Supabase (PostgreSQL) — `games` テーブル  
**Testing**: Vitest（既存設定）  
**Target Platform**: Web (Vercel 想定)  
**Performance Goals**: フィルタ範囲内ゲーム件数が数百〜千件程度、インメモリ集計で十分  
**Constraints**: 既存コンポーネント・パターンを尊重、最小差分

---

## 実装方針

### 1. データ取得・集計（`lib/compatibility.ts`）

既存の `fetchMatchResults(startDate, endDate, { tournamentId })` を呼び出し、返却された `MatchResult[]` をインメモリで集計する。

```
MatchResult.players: MatchPlayer[]
  - name: string
  - rank: number (1始まり、小さい方が上位)
```

各ゲームの `players` 配列から全ペア組み合わせ `(i, j)` を列挙し、`rank` を比較して勝敗カウントを更新する。

```typescript
export type MatchupRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type CompatibilityResult = {
  players: string[];                        // ソート済み全プレーヤーリスト
  matrix: Map<string, Map<string, MatchupRecord>>;
};

export function computeWinRate(r: MatchupRecord): number {
  const total = r.wins + r.losses;
  return total === 0 ? 0 : (r.wins / total) * 100;
}

export async function fetchCompatibilityMatrix(
  startDate?: string,
  endDate?: string,
  options: { tournamentId?: number } = {}
): Promise<{ result: CompatibilityResult | null; error: string | null }>
```

### 2. ページ（`app/compatibility/page.tsx`）

`app/stats/page.tsx` に倣った Server Component として実装する。

- `getCurrentSession()` でセッション取得（ミドルウェアが認証を保証済みだが、ヘッダー表示に必要）
- `resolveFilterParams()` でクエリパラメータを解析（`minGamesRaw` を含む）
- `effectiveMinGames` の計算（stats ページと同じロジック）:
  ```typescript
  const initialMinGamesRaw = Array.isArray(params?.minGames) ? params?.minGames[0] : params?.minGames;
  const hasMinGamesParam = initialMinGamesRaw !== undefined;
  const { filter, start, end, minGames, tournamentId } = resolveFilterParams({
    minGamesRaw: params?.minGames,
    // ... その他パラメータ
  });
  const effectiveMinGames = typeof minGames === "number" ? minGames
    : !hasMinGamesParam && filter === "year" ? 20 : undefined;
  ```
- `fetchCompatibilityMatrix()` でデータ取得（`{ minGames: effectiveMinGames }` を options に渡す）
- `DateRangeFilter` に `showMinGames={true}` を渡す（`initialMinGames={String(effectiveMinGames ?? "")}` も設定）
- マトリクステーブルを JSX で描画（Server Component 内でインライン実装）
- 各行プレーヤーごとに対戦相手セルの勝率を算出し、上位3位まで背景色を適用
  - 色は `lib/stats-rank-theme.ts` の `RANK_ROW_BG`（1位/2位/3位）を再利用
  - 同率は同順位として同じ色を適用（順位バッジは表示しない）

### 3. ヘッダー変更（`components/app-header.tsx`）

```typescript
// Before
type NavTarget = "input" | "matches" | "stats" | "admin";

// After
type NavTarget = "input" | "matches" | "stats" | "compatibility" | "admin";
```

- `navClass` / `handleNavClick` は "compatibility" を `Exclude<NavTarget, "admin">` で自動処理
- ナビリンクに `<Link href="/compatibility" ...>相性表</Link>` を追加（stats の次）

---

## Project Structure

```text
.specify/specs/121-compatibility-matrix/
├── spec.md          ← 作成済み
├── plan.md          ← このファイル
└── tasks.md         ← tasks コマンドで生成

app/
└── compatibility/
    └── page.tsx     ← 新規

lib/
└── compatibility.ts ← 新規

components/
└── app-header.tsx   ← NavTarget 型追加 + リンク追加
```

---

## 既存コンポーネント再利用方針

| コンポーネント/関数 | 再利用方法 |
|---|---|
| `fetchMatchResults` | そのまま呼び出し。フィルタ（日付・トーナメント）を渡す |
| `resolveFilterParams` | `minGamesRaw: params?.minGames` を含めて呼び出す |
| `DateRangeFilter` | `showMinGames={true}` / `initialMinGames` で呼び出す |
| `fetchMatchDates` | availableDates 取得に使用 |
| `fetchTournamentOptions` | トーナメント一覧取得に使用 |
| `getCurrentSession` | セッション取得に使用 |
| `AppHeader` | `current="compatibility"` を渡す |

---

## セルレンダリングロジック

```typescript
function renderCell(record: MatchupRecord | undefined, isSelf: boolean): string {
  if (isSelf) return "-";
  if (!record) return "-";          // 対局なし
  const { wins, losses, draws } = record;
  if (wins === 0 && losses === 0 && draws === 0) return "-";
  const drawPart = draws > 0 ? `${draws}分け` : "";
  const wr = computeWinRate(record);
  return `${wins}勝${losses}敗${drawPart}\n${wr.toFixed(1)}%`;
}

function buildTopWinRateRanksByRow(
  players: string[],
  matrix: Map<string, Map<string, MatchupRecord>>
): Map<string, Map<string, 1 | 2 | 3>> {
  // 行ごとに勝率（小数1位）で降順ソートし、同率同順位で1位〜3位を決定
}
```

---

## テスト方針

`lib/compatibility.ts` の `buildCompatibilityMatrix`（内部ヘルパー）をユニットテスト対象とする。

テストケース：
1. 4人ゲームで rank 1 < rank 2 のペア → 勝ち1
2. 同着順 → 分け1
3. 空の matches → 空のマトリクス
4. 0除算回避（wins + losses = 0）→ 勝率 0%
5. minGames フィルタリング: 2試合以上を選択した場合に参加ゲーム数が 1 のプレーヤーが除外されることを検証
6. minGames = 0 または undefined の場合: 全プレーヤーが返ることを検証（「条件なし」選択時に相当）
---

## リスク・注意事項

| リスク | 対策 |
|---|---|
| `games` テーブルの `rank` が NULL のレコード | ペア処理時に `rank` が falsy なら skip |
| プレーヤー名の表記揺れ（スペース等） | `name.trim()` を適用（既存の fetchMatchResults が trim しているか確認して合わせる） |
| プレーヤー数が多い場合のテーブル幅 | `overflow-x-auto` でラップ |
| NavTarget 型が他ファイルで参照されている場合 | `app-header.tsx` 内の型のみ変更。他に参照なし（Explore 調査済み） |
