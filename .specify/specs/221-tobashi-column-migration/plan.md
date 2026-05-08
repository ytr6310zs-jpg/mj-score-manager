# plan.md — Issue #221: gamesテーブルの飛ばし関連カラム移行と重複解消

## 実装戦略

2段階方式を採用する。

```
フェーズ1（non-breaking）: コード変更 → ビルド確認 → コミット
フェーズ2（breaking）:     DROP COLUMN マイグレーション追加 → ローカル適用 → 確認 → コミット
```

---

## フェーズ1: コード変更詳細

### 1. `lib/matches.ts`

**変更1-A: SELECT文から旧カラムを除去**

```
// Before
`...,is_tobashi1,is_tobashi2,is_tobashi3,is_tobashi4,...,tobashi_player,tobashi_player_id,tobashi_player_ids,...`

// After  
`...,tobashi_player_ids,...`
```

**変更1-B: MatchResult 型から旧フィールドを削除**

```typescript
// 削除
tobashiPlayer: string | null;
tobashiPlayerId: number | null;
```

**変更1-C: MatchPlayer.isTobashi の導出変更**

`tobashiPlayerIds` を先に計算し、players マップ内で `tobashiPlayerIds.includes(id)` を使う。
コード順序を変更（tobashiPlayerIds 計算 → players マップ 内で参照）。

```typescript
// Before
isTobashi: toBool(row[`is_tobashi${slot}`]),

// After
isTobashi: playerId !== null && tobashiPlayerIds.includes(playerId),
```

**変更1-D: 旧フィールドマッピングを削除**

```typescript
// 削除
tobashiPlayer: row["tobashi_player"] ? String(row["tobashi_player"]) : null,
tobashiPlayerId: toNullableId(row["tobashi_player_id"]),
```

---

### 2. `lib/stats.ts`

**変更2-A: legacy fallback ブランチを削除**

```typescript
// 削除対象（lines 85-90）
} else if (match.tobashiPlayerId !== null && match.tobashiPlayerId !== undefined) {
  // Legacy fallback: single tobashiPlayerId
  const tobashiPlayer = match.players.find((p) => p.id === match.tobashiPlayerId);
  if (tobashiPlayer) {
    const acc = playerMap.get(tobashiPlayer.name.trim());
    if (acc) acc.tobashiCount += 1;
  }
}
```

---

### 3. `lib/validate-match.ts`

**変更3-A: tobashiPlayer 単一フィールドのパース・fallback 削除**

```typescript
// 削除
const tobashiPlayer = parseOptionalPlayer(formData.get("tobashiPlayer"));
// ...
: tobashiPlayer ? [tobashiPlayer] : [];
```

tobashiPlayers は `tobashiPlayers` (JSON配列フィールド) のみから取得する。

**変更3-B: ParsedMatchData 型から tobashiPlayer を削除**

```typescript
// 削除
tobashiPlayer: string | null;
```

**変更3-C: buildRankedEntries の tobashiPlayer パラメータ削除**

```typescript
// Before
export function buildRankedEntries(
  players: string[],
  scores: number[],
  yakitoriPlayers: Set<string>,
  tobiPlayers: string[],
  tobashiPlayer: string | null,
  tobashiPlayers: string[] = []
)

// After
export function buildRankedEntries(
  players: string[],
  scores: number[],
  yakitoriPlayers: Set<string>,
  tobiPlayers: string[],
  tobashiPlayers: string[] = []
)
```

`isTobashi` 判定: `tobashiPlayers.includes(player)` のみで判定（fallback 不要）。

---

### 4. `app/actions.ts`

**変更4-A: insert payload から旧カラム書き込みを削除**

```typescript
// 削除
tobashi_player: tobashiPlayer ?? null,
tobashi_player_id: tobashiPlayer ? (nameToId.get(tobashiPlayer) ?? null) : null,
// is_tobashi{slot} のループ内書き込みも削除
row[`is_tobashi${entry.slot}`] = entry.isTobashi;
// 3P 時の is_tobashi4 リセットも削除
row.is_tobashi4 = false;
```

また、`tobashiPlayer` を `validateAndParseMatchForm` の返り値から受け取っていた場合は更新する。

---

### 5. `app/match-actions.ts`

**変更5-A: update payload から旧カラム書き込みを削除**

```typescript
// 削除
tobashi_player: tobashiPlayer ?? null,
tobashi_player_id: tobashiPlayer ? (nameToId.get(tobashiPlayer) ?? null) : null,
// ループ内の is_tobashi{slot}
updatePayload[`is_tobashi${entry.slot}`] = entry.isTobashi;
// 3P 時
updatePayload.is_tobashi4 = false;
```

---

### 6. `components/score-form.tsx`

**変更6-A: tobashiPlayer hidden field を削除**

```tsx
// 削除
<input type="hidden" name="tobashiPlayer" value={tobashiPlayers[0] ?? ""} />
```

---

### 7. `components/match-edit-form.tsx`

**変更7-A: form.append("tobashiPlayer", ...) を削除**

```typescript
// 削除
form.append("tobashiPlayer", tobashiPlayers[0] ?? "");
```

---

## フェーズ2: DROP COLUMN マイグレーション

ファイル: `supabase/migrations/20260508000000_drop_legacy_tobashi_columns.sql`

```sql
-- Issue #221: Drop legacy tobashi columns (breaking change)
-- Prerequisites: All application code must NOT reference these columns before running this migration.
-- Backfill: tobashi_player_ids was already backfilled in 20260504000001_backfill_tobashi_player_ids.sql

ALTER TABLE games
  DROP COLUMN IF EXISTS is_tobashi1,
  DROP COLUMN IF EXISTS is_tobashi2,
  DROP COLUMN IF EXISTS is_tobashi3,
  DROP COLUMN IF EXISTS is_tobashi4,
  DROP COLUMN IF EXISTS tobashi_player,
  DROP COLUMN IF EXISTS tobashi_player_id;
```

---

## ロールバック方針

| フェーズ | ロールバック方法 |
|---|---|
| フェーズ1のみ適用済み | `git revert` でコード変更を戻す（DBカラムはまだ存在） |
| フェーズ2適用後 | ロールフォワード推奨（カラム再 ADD + 再バックフィル）。または事前バックアップから復元 |

**本番適用前の必須手順:**
1. `pg_dump` または Supabase ダッシュボードでバックアップ取得
2. ステージング環境でフルフロー（入力・編集・統計・CSV）確認
3. フェーズ1のコードデプロイを先行
4. フェーズ2（DROP）は別のデプロイ・メンテナンスウィンドウで実施推奨

---

## ビルド・テスト計画

```bash
npm run build        # 必須: TypeScript 型エラー検出
npm run lint         # lint チェック
# E2Eテスト（要ローカルSupabase起動）
npx supabase@2.84.2 start
npm run supabase:reset   # フェーズ2マイグレーション込みでリセット
npx playwright test test/e2e/ui/score-entry.spec.ts
```
