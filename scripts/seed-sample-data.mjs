/**
 * サンプルデータをGoogle Spreadsheetに投入するスクリプト
 *
 * 実行方法:
 *   node scripts/seed-sample-data.mjs
 *
 * .env.local の認証情報を使用します。
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// .env.local を手動でパース
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // ダブルクォート除去
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    throw new Error(`環境変数ファイルが見つかりません: ${filePath}`);
  }
}

const env = loadEnv(join(ROOT, ".env.local"));

const SPREADSHEET_ID = env.GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const SHEET_TITLE = env.GOOGLE_SHEET_TITLE ?? "Sheet1";

// ヘッダー定義（saveScoreAction と同じ順序）
const HEADERS = [
  "date", "gameType", "playerCount",
  "player1", "score1", "rank1", "isTobi1", "isTobashi1", "isYakitori1",
  "player2", "score2", "rank2", "isTobi2", "isTobashi2", "isYakitori2",
  "player3", "score3", "rank3", "isTobi3", "isTobashi3", "isYakitori3",
  "player4", "score4", "rank4", "isTobi4", "isTobashi4", "isYakitori4",
  "scoreTotal", "topPlayer", "lastPlayer",
  "tobiPlayer", "tobashiPlayer", "yakitoriPlayers",
  "notes", "createdAt",
];

// サンプルデータ
// 合計スコアは必ず 0 になるよう設計
const SAMPLE_GAMES = [
  // ゲーム1: 4人戦 飛びあり
  {
    date: "2026-03-01",
    gameType: "4p",
    playerCount: 4,
    player1: "杉原",   score1: 45,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "横山",   score2: 12,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "前田",   score3: -20, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "村上",   score4: -37, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "杉原", lastPlayer: "村上",
    tobiPlayer: "村上", tobashiPlayer: "杉原",
    yakitoriPlayers: "",
    notes: "サンプルデータ1",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  // ゲーム2: 4人戦 焼き鳥あり
  {
    date: "2026-03-05",
    gameType: "4p",
    playerCount: 4,
    player1: "田宮",   score1: 65,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "谷口",   score2: 5,   rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "加藤",   score3: -15, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "福本",   score4: -55, rank4: 4, isTobi4: false, isTobashi4: false, isYakitori4: true,
    scoreTotal: 0,
    topPlayer: "田宮", lastPlayer: "福本",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "福本",
    notes: "サンプルデータ2",
    createdAt: "2026-03-05T14:30:00.000Z",
  },
  // ゲーム3: 4人戦 飛び + 焼き鳥あり
  {
    date: "2026-03-10",
    gameType: "4p",
    playerCount: 4,
    player1: "西村",     score1: 38,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "沢尾望",   score2: 20,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "沢尾徹平", score3: -8,  rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: true,
    player4: "山本有美", score4: -50, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "西村", lastPlayer: "山本有美",
    tobiPlayer: "山本有美", tobashiPlayer: "西村",
    yakitoriPlayers: "沢尾徹平",
    notes: "サンプルデータ3",
    createdAt: "2026-03-10T19:00:00.000Z",
  },
  // ゲーム4: 3人戦 飛びあり
  {
    date: "2026-03-15",
    gameType: "3p",
    playerCount: 3,
    player1: "山本恭大",   score1: 58,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "長谷川彩未", score2: 2,   rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "長谷川柊太", score3: -60, rank3: 3, isTobi3: true,  isTobashi3: false, isYakitori3: false,
    player4: "", score4: "", rank4: "", isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "山本恭大", lastPlayer: "長谷川柊太",
    tobiPlayer: "長谷川柊太", tobashiPlayer: "山本恭大",
    yakitoriPlayers: "",
    notes: "サンプルデータ4",
    createdAt: "2026-03-15T20:00:00.000Z",
  },
  // ゲーム5: 3人戦 焼き鳥あり
  {
    date: "2026-03-20",
    gameType: "3p",
    playerCount: 3,
    player1: "太雅",   score1: 45,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "杉原",   score2: -15, rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "横山",   score3: -30, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: true,
    player4: "", score4: "", rank4: "", isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "太雅", lastPlayer: "横山",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "横山",
    notes: "サンプルデータ5",
    createdAt: "2026-03-20T18:00:00.000Z",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 同日複数対戦 (2026-03-25, 10試合)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 試合1: 4人戦 通常
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "杉原",   score1: 52,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "田宮",   score2: 18,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "横山",   score3: -25, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "前田",   score4: -45, rank4: 4, isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "杉原", lastPlayer: "前田",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "",
    notes: "2026-03-25 第1試合",
    createdAt: "2026-03-25T10:00:00.000Z",
  },
  // 試合2: 4人戦 飛びあり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "西村",   score1: 63,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "谷口",   score2: 10,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "村上",   score3: -20, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "加藤",   score4: -53, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "西村", lastPlayer: "加藤",
    tobiPlayer: "加藤", tobashiPlayer: "西村",
    yakitoriPlayers: "",
    notes: "2026-03-25 第2試合",
    createdAt: "2026-03-25T10:45:00.000Z",
  },
  // 試合3: 4人戦 焼き鳥あり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "沢尾望",   score1: 40,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "山本有美", score2: 15,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "福本",     score3: -18, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "沢尾徹平", score4: -37, rank4: 4, isTobi4: false, isTobashi4: false, isYakitori4: true,
    scoreTotal: 0,
    topPlayer: "沢尾望", lastPlayer: "沢尾徹平",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "沢尾徹平",
    notes: "2026-03-25 第3試合",
    createdAt: "2026-03-25T11:30:00.000Z",
  },
  // 試合4: 4人戦 飛び+焼き鳥あり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "田宮",   score1: 70,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "杉原",   score2: 5,   rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "前田",   score3: -15, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: true,
    player4: "谷口",   score4: -60, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "田宮", lastPlayer: "谷口",
    tobiPlayer: "谷口", tobashiPlayer: "田宮",
    yakitoriPlayers: "前田",
    notes: "2026-03-25 第4試合",
    createdAt: "2026-03-25T12:15:00.000Z",
  },
  // 試合5: 3人戦 通常
  {
    date: "2026-03-25",
    gameType: "3p",
    playerCount: 3,
    player1: "山本恭大",   score1: 35,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "横山",       score2: 10,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "長谷川彩未", score3: -45, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "", score4: "", rank4: "", isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "山本恭大", lastPlayer: "長谷川彩未",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "",
    notes: "2026-03-25 第5試合",
    createdAt: "2026-03-25T13:00:00.000Z",
  },
  // 試合6: 4人戦 通常
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "長谷川柊太", score1: 48,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "西村",       score2: 12,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "村上",       score3: -22, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "加藤",       score4: -38, rank4: 4, isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "長谷川柊太", lastPlayer: "加藤",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "",
    notes: "2026-03-25 第6試合",
    createdAt: "2026-03-25T14:00:00.000Z",
  },
  // 試合7: 4人戦 飛びあり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "太雅",   score1: 55,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "沢尾望", score2: 8,   rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "田宮",   score3: -10, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "福本",   score4: -53, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "太雅", lastPlayer: "福本",
    tobiPlayer: "福本", tobashiPlayer: "太雅",
    yakitoriPlayers: "",
    notes: "2026-03-25 第7試合",
    createdAt: "2026-03-25T14:45:00.000Z",
  },
  // 試合8: 3人戦 焼き鳥あり
  {
    date: "2026-03-25",
    gameType: "3p",
    playerCount: 3,
    player1: "杉原",       score1: 60,  rank1: 1, isTobi1: false, isTobashi1: false, isYakitori1: false,
    player2: "山本有美",   score2: -10, rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "長谷川彩未", score3: -50, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: true,
    player4: "", score4: "", rank4: "", isTobi4: false, isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "杉原", lastPlayer: "長谷川彩未",
    tobiPlayer: "", tobashiPlayer: "",
    yakitoriPlayers: "長谷川彩未",
    notes: "2026-03-25 第8試合",
    createdAt: "2026-03-25T15:30:00.000Z",
  },
  // 試合9: 4人戦 飛び+焼き鳥あり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "谷口",       score1: 44,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "横山",       score2: 16,  rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "長谷川柊太", score3: -5,  rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: true,
    player4: "沢尾徹平",   score4: -55, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "谷口", lastPlayer: "沢尾徹平",
    tobiPlayer: "沢尾徹平", tobashiPlayer: "谷口",
    yakitoriPlayers: "長谷川柊太",
    notes: "2026-03-25 第9試合",
    createdAt: "2026-03-25T16:15:00.000Z",
  },
  // 試合10: 4人戦 飛びあり
  {
    date: "2026-03-25",
    gameType: "4p",
    playerCount: 4,
    player1: "山本恭大", score1: 72,  rank1: 1, isTobi1: false, isTobashi1: true,  isYakitori1: false,
    player2: "西村",     score2: 3,   rank2: 2, isTobi2: false, isTobashi2: false, isYakitori2: false,
    player3: "村上",     score3: -15, rank3: 3, isTobi3: false, isTobashi3: false, isYakitori3: false,
    player4: "太雅",     score4: -60, rank4: 4, isTobi4: true,  isTobashi4: false, isYakitori4: false,
    scoreTotal: 0,
    topPlayer: "山本恭大", lastPlayer: "太雅",
    tobiPlayer: "太雅", tobashiPlayer: "山本恭大",
    yakitoriPlayers: "",
    notes: "2026-03-25 第10試合",
    createdAt: "2026-03-25T17:00:00.000Z",
  },
];

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

  const sheet = doc.sheetsByTitle[SHEET_TITLE] ?? doc.sheetsByIndex[0];
  if (!sheet) {
    throw new Error(`シート "${SHEET_TITLE}" が見つかりません`);
  }

  console.log(`シート: "${sheet.title}" に接続しました`);

  // ヘッダー行を設定（空シートの場合のみ）
  await sheet.loadHeaderRow().catch(() => null);
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    console.log("ヘッダー行を設定します...");
    await sheet.setHeaderRow(HEADERS);
    console.log("ヘッダー行を設定しました");
  } else {
    console.log(`既存ヘッダーを使用: ${sheet.headerValues.join(", ")}`);
  }

  // サンプルデータを1行ずつ追加（同日複数対戦の10試合のみ）
  const newGames = SAMPLE_GAMES.slice(5);
  for (const [index, game] of newGames.entries()) {
    await sheet.addRow(game);
    console.log(
      `  [${index + 1}/${newGames.length}] ${game.date} (${game.gameType}) トップ: ${game.topPlayer} → 追加`
    );
  }

  console.log(`\n完了: ${newGames.length} 件のサンプルデータを投入しました`);
}

main().catch((err) => {
  console.error("エラー:", err.message ?? err);
  process.exit(1);
});
