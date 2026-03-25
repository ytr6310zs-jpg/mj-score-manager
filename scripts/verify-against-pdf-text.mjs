import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
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

function round1(value) {
  return Math.round(value * 10) / 10;
}

function pctNum(rate) {
  return round1(rate * 100);
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
        topRate: pctNum(games > 0 ? s.topCount / games : 0),
        lastAvoidanceRate: pctNum(games > 0 ? 1 - s.lastCount / games : 0),
        tobashiCount: s.tobashiCount,
        tobiCount: s.tobiCount,
        yakitoriCount: s.yakitoriCount,
        tobashiRate: pctNum(games > 0 ? s.tobashiCount / games : 0),
        tobiAvoidanceRate: pctNum(games > 0 ? 1 - s.tobiCount / games : 0),
        yakitoriAvoidanceRate: pctNum(games > 0 ? 1 - s.yakitoriCount / games : 0),
        setaiRate: pctNum(games > 0 ? middleCount / games : 0),
      };
    });
}

// ユーザー添付のPDF全文テキストから抽出した2ページ目の期待値
const expected = new Map([
  ["杉原", { rank: 1, totalScore: 429, games: 28, topCount: 16, lastCount: 6, topRate: 57.1, lastAvoidanceRate: 78.6, tobashiCount: 7, tobiCount: 4, yakitoriCount: 5, tobashiRate: 25.0, tobiAvoidanceRate: 85.7, yakitoriAvoidanceRate: 82.1, setaiRate: 21.4 }],
  ["沢尾望", { rank: 2, totalScore: 225, games: 43, topCount: 17, lastCount: 15, topRate: 39.5, lastAvoidanceRate: 65.1, tobashiCount: 10, tobiCount: 8, yakitoriCount: 10, tobashiRate: 23.3, tobiAvoidanceRate: 81.4, yakitoriAvoidanceRate: 76.7, setaiRate: 25.6 }],
  ["沢尾徹平", { rank: 3, totalScore: 187, games: 36, topCount: 15, lastCount: 9, topRate: 41.7, lastAvoidanceRate: 75.0, tobashiCount: 3, tobiCount: 3, yakitoriCount: 3, tobashiRate: 8.3, tobiAvoidanceRate: 91.7, yakitoriAvoidanceRate: 91.7, setaiRate: 33.3 }],
  ["山本有美", { rank: 4, totalScore: 90, games: 45, topCount: 14, lastCount: 9, topRate: 31.1, lastAvoidanceRate: 80.0, tobashiCount: 6, tobiCount: 5, yakitoriCount: 5, tobashiRate: 13.3, tobiAvoidanceRate: 88.9, yakitoriAvoidanceRate: 88.9, setaiRate: 48.9 }],
  ["横山", { rank: 5, totalScore: 66, games: 8, topCount: 3, lastCount: 3, topRate: 37.5, lastAvoidanceRate: 62.5, tobashiCount: 4, tobiCount: 2, yakitoriCount: 3, tobashiRate: 50.0, tobiAvoidanceRate: 75.0, yakitoriAvoidanceRate: 62.5, setaiRate: 25.0 }],
  ["前田", { rank: 6, totalScore: 42, games: 2, topCount: 1, lastCount: 0, topRate: 50.0, lastAvoidanceRate: 100.0, tobashiCount: 1, tobiCount: 0, yakitoriCount: 0, tobashiRate: 50.0, tobiAvoidanceRate: 100.0, yakitoriAvoidanceRate: 100.0, setaiRate: 50.0 }],
  ["村上", { rank: 7, totalScore: 16, games: 1, topCount: 0, lastCount: 0, topRate: 0.0, lastAvoidanceRate: 100.0, tobashiCount: 1, tobiCount: 0, yakitoriCount: 0, tobashiRate: 100.0, tobiAvoidanceRate: 100.0, yakitoriAvoidanceRate: 100.0, setaiRate: 100.0 }],
  ["田宮", { rank: 8, totalScore: -8, games: 33, topCount: 9, lastCount: 10, topRate: 27.3, lastAvoidanceRate: 69.7, tobashiCount: 8, tobiCount: 5, yakitoriCount: 5, tobashiRate: 24.2, tobiAvoidanceRate: 84.8, yakitoriAvoidanceRate: 84.8, setaiRate: 42.4 }],
  ["谷口", { rank: 9, totalScore: -16, games: 1, topCount: 0, lastCount: 1, topRate: 0.0, lastAvoidanceRate: 0.0, tobashiCount: 0, tobiCount: 0, yakitoriCount: 0, tobashiRate: 0.0, tobiAvoidanceRate: 100.0, yakitoriAvoidanceRate: 100.0, setaiRate: 0.0 }],
  ["加藤", { rank: 10, totalScore: -89, games: 42, topCount: 13, lastCount: 14, topRate: 31.0, lastAvoidanceRate: 66.7, tobashiCount: 10, tobiCount: 10, yakitoriCount: 9, tobashiRate: 23.8, tobiAvoidanceRate: 76.2, yakitoriAvoidanceRate: 78.6, setaiRate: 35.7 }],
  ["福本", { rank: 11, totalScore: -134, games: 4, topCount: 0, lastCount: 3, topRate: 0.0, lastAvoidanceRate: 25.0, tobashiCount: 0, tobiCount: 2, yakitoriCount: 2, tobashiRate: 0.0, tobiAvoidanceRate: 50.0, yakitoriAvoidanceRate: 50.0, setaiRate: 25.0 }],
  ["西村", { rank: 12, totalScore: -295, games: 31, topCount: 8, lastCount: 15, topRate: 25.8, lastAvoidanceRate: 51.6, tobashiCount: 7, tobiCount: 10, yakitoriCount: 9, tobashiRate: 22.6, tobiAvoidanceRate: 67.7, yakitoriAvoidanceRate: 71.0, setaiRate: 25.8 }],
  ["山本恭大", { rank: 13, totalScore: -513, games: 36, topCount: 8, lastCount: 18, topRate: 22.2, lastAvoidanceRate: 50.0, tobashiCount: 3, tobiCount: 11, yakitoriCount: 11, tobashiRate: 8.3, tobiAvoidanceRate: 69.4, yakitoriAvoidanceRate: 69.4, setaiRate: 27.8 }],
]);

const comparedFields = [
  "rank",
  "totalScore",
  "games",
  "topCount",
  "lastCount",
  "topRate",
  "lastAvoidanceRate",
  "tobashiCount",
  "tobiCount",
  "yakitoriCount",
  "tobashiRate",
  "tobiAvoidanceRate",
  "yakitoriAvoidanceRate",
  "setaiRate",
];

async function main() {
  const writeSheet = process.argv.includes("--write-sheet");
  const env = loadEnv(join(ROOT, ".env.dev.local"));
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

  const rows = await sheet1.getRows();
  const actualStats = aggregateStats(rows);
  const actualByName = new Map(actualStats.map((s) => [s.name, s]));

  const diffs = [];

  for (const [name, exp] of expected.entries()) {
    const act = actualByName.get(name);
    if (!act) {
      diffs.push(`${name}: 実データに存在しません`);
      continue;
    }

    for (const field of comparedFields) {
      const e = exp[field];
      const a = act[field];
      const isNumber = typeof e === "number";
      const match = isNumber ? Math.abs(a - e) < 0.11 : a === e;
      if (!match) {
        diffs.push(`${name}.${field}: expected=${e}, actual=${a}`);
      }
    }
  }

  const missingInExpected = actualStats
    .map((s) => s.name)
    .filter((name) => !expected.has(name));

  const compareRows = [];

  for (const [name, exp] of expected.entries()) {
    const act = actualByName.get(name);
    if (!act) {
      compareRows.push({
        "プレイヤー": name,
        "項目": "存在チェック",
        expected: "あり",
        actual: "なし",
        "結果": "NG",
      });
      continue;
    }

    for (const field of comparedFields) {
      const e = exp[field];
      const a = act[field];
      const isNumber = typeof e === "number";
      const ok = isNumber ? Math.abs(a - e) < 0.11 : a === e;
      compareRows.push({
        "プレイヤー": name,
        "項目": field,
        expected: String(e),
        actual: String(a),
        "結果": ok ? "OK" : "NG",
      });
    }
  }

  for (const name of missingInExpected) {
    compareRows.push({
      "プレイヤー": name,
      "項目": "期待値定義",
      expected: "未定義",
      actual: "実データに存在",
      "結果": "参考",
    });
  }

  if (writeSheet) {
    let compareSheet = doc.sheetsByTitle["PDF照合"];
    const compareHeaders = [
      "プレイヤー",
      "項目",
      "expected",
      "actual",
      "結果",
    ];
    if (!compareSheet) {
      compareSheet = await doc.addSheet({
        title: "PDF照合",
        headerValues: compareHeaders,
      });
    } else {
      await compareSheet.clear();
      await compareSheet.setHeaderRow(compareHeaders);
    }

    if (compareRows.length > 0) {
      await compareSheet.addRows(compareRows);
    }
  }

  console.log(`比較対象(期待値): ${expected.size}名`);
  console.log(`実データ(Sheet1): ${actualStats.length}名`);

  if (missingInExpected.length > 0) {
    console.log("期待値に定義がないプレイヤー:", missingInExpected.join(", "));
  }

  if (diffs.length === 0) {
    console.log("\n検証結果: 一致しました");
  } else {
    console.log(`\n検証結果: 不一致 ${diffs.length} 件`);
    for (const d of diffs.slice(0, 50)) {
      console.log(`- ${d}`);
    }
    if (diffs.length > 50) {
      console.log(`... ほか ${diffs.length - 50} 件`);
    }
    process.exitCode = 2;
  }

  if (writeSheet) {
    console.log('照合詳細はシート "PDF照合" に出力しました');
  } else {
    console.log('照合詳細のシート出力は未実行です（必要なら --write-sheet を付けて実行）');
  }
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
