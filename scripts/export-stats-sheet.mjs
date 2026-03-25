/**
 * lib/stats.ts と同一の集計ロジックを使い、
 * 「集計」シートに個人成績をプロットするスクリプト。
 * シートが存在しない場合は自動作成します。
 * 既存データはすべて上書きします。
 *
 * 実行方法:
 *   node scripts/export-stats-sheet.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// .env.dev.local を手動でパース
function loadEnv(filePath) {
  const content = readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv(join(ROOT, ".env.dev.local"));

const SPREADSHEET_ID = env.GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const SOURCE_SHEET_TITLE = env.GOOGLE_SHEET_TITLE ?? "Sheet1";
const STATS_SHEET_TITLE = "集計";

// ─── ヘルパー関数 (lib/stats.ts と同一ロジック) ─────────────────────────────

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    return upper === "TRUE" || upper === "1";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function toInt(value) {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}

function pct(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

// ─── 集計 ─────────────────────────────────────────────────────────────────────

function aggregateStats(rows) {
  const playerMap = new Map();

  for (const row of rows) {
    const playerCount = toInt(row.get("playerCount")) || 3;
    const slots = playerCount >= 4 ? [1, 2, 3, 4] : [1, 2, 3];

    for (const slot of slots) {
      const playerName = String(row.get(`player${slot}`) ?? "").trim();
      if (!playerName) continue;

      const score     = toInt(row.get(`score${slot}`));
      const rank      = toInt(row.get(`rank${slot}`));
      const isTop     = rank === 1;
      const isLast    = rank === playerCount;
      const isTobashi = toBool(row.get(`isTobashi${slot}`));
      const isTobi    = toBool(row.get(`isTobi${slot}`));
      const isYakitori= toBool(row.get(`isYakitori${slot}`));

      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          totalScore: 0, games: 0,
          topCount: 0, lastCount: 0,
          tobashiCount: 0, tobiCount: 0, yakitoriCount: 0,
        });
      }
      const acc = playerMap.get(playerName);
      acc.totalScore  += score;
      acc.games       += 1;
      if (isTop)      acc.topCount     += 1;
      if (isLast)     acc.lastCount    += 1;
      if (isTobashi)  acc.tobashiCount += 1;
      if (isTobi)     acc.tobiCount    += 1;
      if (isYakitori) acc.yakitoriCount+= 1;
    }
  }

  const sorted = Array.from(playerMap.entries())
    .filter(([, s]) => s.games > 0)
    .sort(([, a], [, b]) => b.totalScore - a.totalScore);

  return sorted.map(([name, s], index) => {
    const { games } = s;
    const middleCount = games - s.topCount - s.lastCount;

    const topRate            = games > 0 ? s.topCount / games : 0;
    const lastAvoidanceRate  = games > 0 ? 1 - s.lastCount / games : 0;
    const tobashiRate        = games > 0 ? s.tobashiCount / games : 0;
    const tobiAvoidanceRate  = games > 0 ? 1 - s.tobiCount / games : 0;
    const yakitoriAvoidanceRate = games > 0 ? 1 - s.yakitoriCount / games : 0;
    const setaiRate          = games > 0 ? middleCount / games : 0;

    return {
      // ── 検証用: 集計元データ ──
      rank:          index + 1,
      name,
      totalScore:    s.totalScore,
      games,
      topCount:      s.topCount,
      lastCount:     s.lastCount,
      tobashiCount:  s.tobashiCount,
      tobiCount:     s.tobiCount,
      yakitoriCount: s.yakitoriCount,
      // ── 計算値 ──
      topRate:              pct(topRate),
      lastAvoidanceRate:    pct(lastAvoidanceRate),
      tobashiRate:          pct(tobashiRate),
      tobiAvoidanceRate:    pct(tobiAvoidanceRate),
      yakitoriAvoidanceRate:pct(yakitoriAvoidanceRate),
      setaiRate:            pct(setaiRate),
      // ── 検証用: 計算式メモ ──
      formula_topRate:             `=${s.topCount}/${games}`,
      formula_lastAvoidanceRate:   `=1-${s.lastCount}/${games}`,
      formula_tobashiRate:         `=${s.tobashiCount}/${games}`,
      formula_tobiAvoidanceRate:   `=1-${s.tobiCount}/${games}`,
      formula_yakitoriAvoidanceRate:`=1-${s.yakitoriCount}/${games}`,
      formula_setaiRate:           `=${middleCount}/${games} (中間=${middleCount}=対局数-トップ-ラス)`,
    };
  });
}

// ─── ヘッダー定義 ─────────────────────────────────────────────────────────────

const STATS_HEADERS = [
  "順位", "名前", "合計点", "対局数",
  "トップ回数", "ラス回数", "飛ばし回数", "飛び回数", "焼き鳥回数",
  "トップ率", "ラス回避率", "飛ばし率", "飛び回避率", "焼き鳥回避率", "接待率",
  // 検証用列
  "計算式:トップ率", "計算式:ラス回避率", "計算式:飛ばし率",
  "計算式:飛び回避率", "計算式:焼き鳥回避率", "計算式:接待率",
];

// ─── メイン ───────────────────────────────────────────────────────────────────

async function main() {
  const { JWT } = await import("google-auth-library");
  const { GoogleSpreadsheet } = await import("google-spreadsheet");

  const auth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  await doc.loadInfo();
  console.log(`スプレッドシート: "${doc.title}" に接続しました`);

  // ── ソースシート読み込み ───────────────────────────────────────────────────
  const sourceSheet = doc.sheetsByTitle[SOURCE_SHEET_TITLE] ?? doc.sheetsByIndex[0];
  if (!sourceSheet) {
    throw new Error(`ソースシート "${SOURCE_SHEET_TITLE}" が見つかりません`);
  }

  console.log(`ソース: "${sourceSheet.title}" からデータ読み込み中...`);
  const rows = await sourceSheet.getRows();
  console.log(`  ${rows.length} 行を読み込みました`);

  // ── 集計 ──────────────────────────────────────────────────────────────────
  const stats = aggregateStats(rows);
  console.log(`  ${stats.length} 名分の成績を集計しました`);

  // ── 集計シートの用意 ───────────────────────────────────────────────────────
  let statsSheet = doc.sheetsByTitle[STATS_SHEET_TITLE];
  if (!statsSheet) {
    console.log(`シート "${STATS_SHEET_TITLE}" が存在しないため作成します...`);
    statsSheet = await doc.addSheet({
      title: STATS_SHEET_TITLE,
      headerValues: STATS_HEADERS,
    });
    console.log(`  作成しました`);
  } else {
    console.log(`シート "${STATS_SHEET_TITLE}" を上書きします...`);
    await statsSheet.clear();
    await statsSheet.setHeaderRow(STATS_HEADERS);
  }

  // ── 書き込み ──────────────────────────────────────────────────────────────
  for (const s of stats) {
    await statsSheet.addRow({
      "順位":         s.rank,
      "名前":         s.name,
      "合計点":       s.totalScore,
      "対局数":       s.games,
      "トップ回数":   s.topCount,
      "ラス回数":     s.lastCount,
      "飛ばし回数":   s.tobashiCount,
      "飛び回数":     s.tobiCount,
      "焼き鳥回数":   s.yakitoriCount,
      "トップ率":             s.topRate,
      "ラス回避率":           s.lastAvoidanceRate,
      "飛ばし率":             s.tobashiRate,
      "飛び回避率":           s.tobiAvoidanceRate,
      "焼き鳥回避率":         s.yakitoriAvoidanceRate,
      "接待率":               s.setaiRate,
      "計算式:トップ率":             s.formula_topRate,
      "計算式:ラス回避率":           s.formula_lastAvoidanceRate,
      "計算式:飛ばし率":             s.formula_tobashiRate,
      "計算式:飛び回避率":           s.formula_tobiAvoidanceRate,
      "計算式:焼き鳥回避率":         s.formula_yakitoriAvoidanceRate,
      "計算式:接待率":               s.formula_setaiRate,
    });
    console.log(`  [${s.rank}] ${s.name} 合計${s.totalScore} (${s.games}戦 トップ${s.topCount}回) → 書き込み`);
  }

  // ── メタ情報行 ─────────────────────────────────────────────────────────────
  await statsSheet.addRow({});
  await statsSheet.addRow({
    "順位": `最終更新: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
    "名前": `ソース: ${SOURCE_SHEET_TITLE} (${rows.length}行)`,
  });

  console.log(`\n完了: "${STATS_SHEET_TITLE}" シートへ ${stats.length} 名分の集計を出力しました`);
  console.log("【検証の見方】");
  console.log("  - 「計算式:xxx」列に各レート値の分子/分母が記載されています");
  console.log("  - アプリのページ /stats と各数値が一致することを確認してください");
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
