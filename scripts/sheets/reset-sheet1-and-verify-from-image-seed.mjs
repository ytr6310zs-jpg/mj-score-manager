import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { IMAGE_SEED_GAMES } from "./image-seed-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

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

function aggregateStats(rows) {
  const playerMap = new Map();

  for (const row of rows) {
    const playerCount = toInt(row.get("playerCount")) || 3;
    const slots = playerCount >= 4 ? [1, 2, 3, 4] : [1, 2, 3];

    for (const slot of slots) {
      const playerName = String(row.get(`player${slot}`) ?? "").trim();
      if (!playerName) continue;

      const score = toInt(row.get(`score${slot}`));
      const rank = toInt(row.get(`rank${slot}`));
      const isTop = rank === 1;
      const isLast = rank === playerCount;
      const isTobashi = toBool(row.get(`isTobashi${slot}`));
      const isTobi = toBool(row.get(`isTobi${slot}`));
      const isYakitori = toBool(row.get(`isYakitori${slot}`));

      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          totalScore: 0,
          games: 0,
          topCount: 0,
          lastCount: 0,
          tobashiCount: 0,
          tobiCount: 0,
          yakitoriCount: 0,
        });
      }

      const acc = playerMap.get(playerName);
      acc.totalScore += score;
      acc.games += 1;
      if (isTop) acc.topCount += 1;
      if (isLast) acc.lastCount += 1;
      if (isTobashi) acc.tobashiCount += 1;
      if (isTobi) acc.tobiCount += 1;
      if (isYakitori) acc.yakitoriCount += 1;
    }
  }

  return Array.from(playerMap.entries())
    .filter(([, s]) => s.games > 0)
    .sort(([, a], [, b]) => b.totalScore - a.totalScore)
    .map(([name, s], index) => {
      const games = s.games;
      const middleCount = games - s.topCount - s.lastCount;
      return {
        name,
        rank: index + 1,
        totalScore: s.totalScore,
        games,
        topCount: s.topCount,
        lastCount: s.lastCount,
        tobashiCount: s.tobashiCount,
        tobiCount: s.tobiCount,
        yakitoriCount: s.yakitoriCount,
        topRate: pct(games > 0 ? s.topCount / games : 0),
        lastAvoidanceRate: pct(games > 0 ? 1 - s.lastCount / games : 0),
        tobashiRate: pct(games > 0 ? s.tobashiCount / games : 0),
        tobiAvoidanceRate: pct(games > 0 ? 1 - s.tobiCount / games : 0),
        yakitoriAvoidanceRate: pct(games > 0 ? 1 - s.yakitoriCount / games : 0),
        setaiRate: pct(games > 0 ? middleCount / games : 0),
      };
    });
}

const BASE_HEADERS = [
  "date", "gameType", "playerCount",
  "player1", "score1", "rank1", "isTobi1", "isTobashi1", "isYakitori1",
  "player2", "score2", "rank2", "isTobi2", "isTobashi2", "isYakitori2",
  "player3", "score3", "rank3", "isTobi3", "isTobashi3", "isYakitori3",
  "player4", "score4", "rank4", "isTobi4", "isTobashi4", "isYakitori4",
  "scoreTotal", "topPlayer", "lastPlayer", "tobiPlayer", "tobashiPlayer", "yakitoriPlayers",
  "notes", "createdAt",
];

const VERIFY_HEADERS = [
  "順位", "名前", "合計点", "対局数", "トップ回数", "ラス回数", "飛ばし回数", "飛び回数", "焼き鳥回数",
  "トップ率", "ラス回避率", "飛ばし率", "飛び回避率", "焼き鳥回避率", "接待率",
  "検証メモ"
];

async function main() {
  const env = loadEnv(join(ROOT, ".env.local"));
  const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

  const { JWT } = await import("google-auth-library");
  const { GoogleSpreadsheet } = await import("google-spreadsheet");

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();

  const sheet1 = doc.sheetsByTitle[env.GOOGLE_SHEET_TITLE || "Sheet1"] ?? doc.sheetsByIndex[0];
  if (!sheet1) throw new Error("Sheet1 が見つかりません");

  console.log(`Sheet1(${sheet1.title}) をクリアします...`);
  await sheet1.clear();
  await sheet1.setHeaderRow(BASE_HEADERS);

  for (const [index, row] of IMAGE_SEED_GAMES.entries()) {
    await sheet1.addRow(row);
    console.log(`  [${index + 1}/${IMAGE_SEED_GAMES.length}] ${row.notes} を投入`);
  }

  const rows = await sheet1.getRows();
  const stats = aggregateStats(rows);

  let verifySheet = doc.sheetsByTitle["集計_検証"];
  if (!verifySheet) {
    verifySheet = await doc.addSheet({ title: "集計_検証", headerValues: VERIFY_HEADERS });
  } else {
    await verifySheet.clear();
    await verifySheet.setHeaderRow(VERIFY_HEADERS);
  }

  for (const s of stats) {
    await verifySheet.addRow({
      "順位": s.rank,
      "名前": s.name,
      "合計点": s.totalScore,
      "対局数": s.games,
      "トップ回数": s.topCount,
      "ラス回数": s.lastCount,
      "飛ばし回数": s.tobashiCount,
      "飛び回数": s.tobiCount,
      "焼き鳥回数": s.yakitoriCount,
      "トップ率": s.topRate,
      "ラス回避率": s.lastAvoidanceRate,
      "飛ばし率": s.tobashiRate,
      "飛び回避率": s.tobiAvoidanceRate,
      "焼き鳥回避率": s.yakitoriAvoidanceRate,
      "接待率": s.setaiRate,
      "検証メモ": "画像2ページ目の同項目と照合",
    });
  }

  console.log("\n完了:");
  console.log(`- Sheet1 を clear して ${IMAGE_SEED_GAMES.length} 試合を再投入`);
  console.log(`- 集計_検証 に ${stats.length} 名分を出力`);
  console.log("- 画像2ページ目との照合は、順位/合計点/各率を突き合わせて確認してください");
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
