import type { YakumanDef } from "@/lib/yakumans";

const SUBCOL_SCORE = "SCORE";
const SUBCOL_YAKUMAN = "YAKUMAN";
const SUBCOL_YAKITORI = "YAKITORI";
const SUBCOL_TOBI_TOBASHI = "TOBI_TOBASHI";

export type ParsedYakumanSelection = {
  playerName: string;
  yakumanCode: string;
  yakumanName: string;
  points: number | null;
};

export type ParsedSpreadsheetGame = {
  gameNo: number;
  players: string[];
  scores: number[];
  yakitoriPlayers: string[];
  tobiPlayers: string[];
  tobashiPlayers: string[];
  yakumanSelections: ParsedYakumanSelection[];
  gameType: "3p" | "4p";
};

export type ParsedSpreadsheetPayload = {
  sheetTitle: string;
  inferredDate: string | null;
  games: ParsedSpreadsheetGame[];
  warnings: string[];
};

type GameColumnMap = {
  score: number | null;
  yakuman: number | null;
  yakitori: number | null;
  tobiTobashi: number | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeForMatch(value: string): string {
  return value.replace(/[\s\u3000]/g, "").toLowerCase();
}

function parseSubHeader(raw: string): string {
  const normalized = normalizeForMatch(raw).replace(/[()（）_\-/]/g, "");
  if (normalized === "score" || normalized === "点数") return SUBCOL_SCORE;
  if (normalized === "yakuman" || normalized === "役満") return SUBCOL_YAKUMAN;
  if (normalized === "yakitori" || normalized === "焼き鳥") return SUBCOL_YAKITORI;
  if (normalized === "tobitobashi" || normalized === "飛び飛ばし" || normalized === "飛び/飛ばし") {
    return SUBCOL_TOBI_TOBASHI;
  }
  return "";
}

function parseBooleanFlag(raw: string): boolean {
  const token = normalizeForMatch(raw);
  if (!token) return false;
  return token === "true" || token === "1" || token === "yes" || token === "y" || token === "on" || token === "〇";
}

function parseScore(raw: string): number | null {
  const value = normalizeText(raw);
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function parseGameDateFromTitle(sheetTitle: string): string | null {
  const normalized = sheetTitle.trim();
  const match = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function parseTobiTobashiFlags(raw: string): { isTobi: boolean; isTobashi: boolean } {
  const token = normalizeForMatch(raw);
  if (!token) return { isTobi: false, isTobashi: false };
  const isTobi = token.includes("飛び") || token.includes("tobi") || token === "t";
  const isTobashi = token.includes("飛ばし") || token.includes("tobashi") || token === "b";
  return { isTobi, isTobashi };
}

function collectGameColumns(header1: string[], header2: string[]): Map<number, GameColumnMap> {
  const map = new Map<number, GameColumnMap>();
  const maxLen = Math.max(header1.length, header2.length);

  for (let col = 1; col < maxLen; col += 1) {
    const gameNoRaw = normalizeText(header1[col]);
    const subRaw = normalizeText(header2[col]);
    if (!gameNoRaw || !subRaw) continue;

    const gameNo = Number(gameNoRaw);
    if (!Number.isInteger(gameNo) || gameNo < 1 || gameNo > 40) continue;

    const subKey = parseSubHeader(subRaw);
    if (!subKey) continue;

    const row = map.get(gameNo) ?? { score: null, yakuman: null, yakitori: null, tobiTobashi: null };
    if (subKey === SUBCOL_SCORE) row.score = col;
    if (subKey === SUBCOL_YAKUMAN) row.yakuman = col;
    if (subKey === SUBCOL_YAKITORI) row.yakitori = col;
    if (subKey === SUBCOL_TOBI_TOBASHI) row.tobiTobashi = col;
    map.set(gameNo, row);
  }

  return map;
}

function resolveYakumanToken(token: string, yakumans: YakumanDef[]): YakumanDef | null {
  const normalized = normalizeForMatch(token);
  if (!normalized) return null;

  const byCode = yakumans.find((y) => normalizeForMatch(y.code) === normalized);
  if (byCode) return byCode;

  const codePrefix = token.match(/^([A-Za-z0-9]{2,})\s*[:：\-]/);
  if (codePrefix) {
    const byPrefix = yakumans.find((y) => normalizeForMatch(y.code) === normalizeForMatch(codePrefix[1]));
    if (byPrefix) return byPrefix;
  }

  const byNameInclude = yakumans.find((y) => normalized.includes(normalizeForMatch(y.name)) || normalizeForMatch(y.name).includes(normalized));
  return byNameInclude ?? null;
}

function parseYakumanSelections(raw: string, playerName: string, yakumans: YakumanDef[], warnings: string[]): ParsedYakumanSelection[] {
  const value = normalizeText(raw);
  if (!value) return [];

  const tokens = value
    .split(/[;,、\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const selections: ParsedYakumanSelection[] = [];
  for (const token of tokens) {
    const resolved = resolveYakumanToken(token, yakumans);
    if (!resolved) {
      warnings.push(`役満が解決できません: ${playerName} / ${token}`);
      continue;
    }

    selections.push({
      playerName,
      yakumanCode: resolved.code,
      yakumanName: resolved.name,
      points: resolved.points,
    });
  }

  return selections;
}

export function parseSpreadsheetMatrix(
  matrix: string[][],
  sheetTitle: string,
  yakumans: YakumanDef[]
): ParsedSpreadsheetPayload {
  if (!Array.isArray(matrix) || matrix.length < 3) {
    return { sheetTitle, inferredDate: parseGameDateFromTitle(sheetTitle), games: [], warnings: ["シートの行数が不足しています。"] };
  }

  const warnings: string[] = [];
  const header1 = matrix[0] ?? [];
  const header2 = matrix[1] ?? [];
  const gameColumns = collectGameColumns(header1, header2);
  const gameNos = Array.from(gameColumns.keys()).sort((a, b) => a - b);

  if (gameNos.length === 0) {
    return { sheetTitle, inferredDate: parseGameDateFromTitle(sheetTitle), games: [], warnings: ["試合列（1..40 と副列）が見つかりません。"] };
  }

  const playerRows = matrix.slice(2)
    .map((row) => ({ name: normalizeText(row[0]), row }))
    .filter((entry) => Boolean(entry.name));

  const games: ParsedSpreadsheetGame[] = [];
  for (const gameNo of gameNos) {
    const col = gameColumns.get(gameNo);
    if (!col || col.score === null) continue;

    const players: string[] = [];
    const scores: number[] = [];
    const yakitoriPlayers: string[] = [];
    const tobiPlayers: string[] = [];
    const tobashiPlayers: string[] = [];
    const yakumanSelections: ParsedYakumanSelection[] = [];

    for (const { name, row } of playerRows) {
      const score = parseScore(normalizeText(row[col.score]));
      if (score === null) continue;

      players.push(name);
      scores.push(score);

      if (col.yakitori !== null && parseBooleanFlag(normalizeText(row[col.yakitori]))) {
        yakitoriPlayers.push(name);
      }

      if (col.tobiTobashi !== null) {
        const flags = parseTobiTobashiFlags(normalizeText(row[col.tobiTobashi]));
        if (flags.isTobi) tobiPlayers.push(name);
        if (flags.isTobashi) tobashiPlayers.push(name);
      }

      if (col.yakuman !== null) {
        yakumanSelections.push(...parseYakumanSelections(normalizeText(row[col.yakuman]), name, yakumans, warnings));
      }
    }

    if (players.length === 0) continue;

    if (players.length !== 3 && players.length !== 4) {
      warnings.push(`試合${gameNo}: 参加人数が不正です (${players.length}人)`);
      continue;
    }

    games.push({
      gameNo,
      players,
      scores,
      yakitoriPlayers,
      tobiPlayers,
      tobashiPlayers,
      yakumanSelections,
      gameType: players.length === 4 ? "4p" : "3p",
    });
  }

  return {
    sheetTitle,
    inferredDate: parseGameDateFromTitle(sheetTitle),
    games,
    warnings,
  };
}

export function parseSpreadsheetIdFromUrl(url: string): string | null {
  const value = normalizeText(url);
  if (!value) return null;
  const idMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch?.[1]) return idMatch[1];
  return null;
}

export function buildImportDedupeKey(tournamentId: number, gameDate: string, gameNo: number, players: string[]): string {
  const normalizedPlayers = [...players].map((p) => normalizeForMatch(p)).sort((a, b) => a.localeCompare(b, "ja"));
  return `${tournamentId}|${gameDate}|${gameNo}|${normalizedPlayers.join(",")}`;
}

export function parseGameNoFromNotes(notes: string): number | null {
  const match = String(notes ?? "").match(/SPREADSHEET_IMPORT\s+gameNo=(\d+)/i);
  if (!match) return null;
  const gameNo = Number(match[1]);
  return Number.isInteger(gameNo) ? gameNo : null;
}

export function findFuzzyPlayerCandidates(inputName: string, knownPlayers: string[]): string[] {
  const normalizedInput = normalizeForMatch(inputName);
  if (!normalizedInput) return [];

  const scored = knownPlayers
    .map((name) => {
      const normalized = normalizeForMatch(name);
      let score = 0;
      if (normalized === normalizedInput) score = 100;
      else if (normalized.startsWith(normalizedInput) || normalizedInput.startsWith(normalized)) score = 80;
      else if (normalized.includes(normalizedInput) || normalizedInput.includes(normalized)) score = 60;
      return { name, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ja"));

  return scored.slice(0, 5).map((entry) => entry.name);
}
