import type { YakumanDef } from "@/lib/yakumans";

const MIN_GAME_NO = 1;
const MAX_GAME_NO = 40;

export type ParsedYakumanSelection = {
  playerName: string;
  yakumanCode: string;
  yakumanName: string;
  points: number | null;
  count: number;
};

type ParsedCellFlags = {
  yakitori: boolean;
  tobi: boolean;
  tobashi: boolean;
  hasConflict: boolean;
};

export type ParsedSpreadsheetGame = {
  gameNo: number;
  players: string[];
  scores: number[];
  yakitoriPlayers: string[];
  tobiPlayers: string[];
  tobashiPlayers: string[];
  conflictingFlagPlayers: string[];
  yakumanSelections: ParsedYakumanSelection[];
  gameType: "3p" | "4p";
};

export type ParsedSpreadsheetPayload = {
  sheetTitle: string;
  inferredDate: string | null;
  games: ParsedSpreadsheetGame[];
  warnings: string[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeForMatch(value: string): string {
  return value.replace(/[\s\u3000]/g, "").toLowerCase();
}

function normalizeFlagToken(raw: string): string {
  return normalizeForMatch(raw).replace(/[()（）._\-]/g, "");
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

  // 例: 2026-05-11 / 2026.5.11 / 2026/05/11
  const separated = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (separated) {
    const year = Number(separated[1]);
    const month = Number(separated[2]);
    const day = Number(separated[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  // 例: 大会1_20260511 / 20260511
  const compact = normalized.match(/(?:^|[^0-9])(\d{4})(\d{2})(\d{2})(?:[^0-9]|$)/);
  if (!compact) return null;
  const year = Number(compact[1]);
  const month = Number(compact[2]);
  const day = Number(compact[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function parseCellValue(raw: string): { score: number | null; flags: ParsedCellFlags } {
  const value = normalizeText(raw);
  const emptyFlags: ParsedCellFlags = { yakitori: false, tobi: false, tobashi: false, hasConflict: false };
  if (!value) {
    return { score: null, flags: emptyFlags };
  }

  const normalized = value.replace(/[，、／;；|｜]/g, ",");
  const tokens = normalized.split(",").map((token) => token.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return { score: null, flags: emptyFlags };
  }

  const score = parseScore(tokens[0]);
  if (score === null) {
    return { score: null, flags: emptyFlags };
  }

  let yakitori = false;
  let tobi = false;
  let tobashi = false;

  for (const token of tokens.slice(1)) {
    const normalizedToken = normalizeFlagToken(token);
    if (!normalizedToken) continue;

    if (normalizedToken === "tb" || normalizedToken === "tobi" || normalizedToken === "飛び") {
      tobi = true;
      continue;
    }
    if (normalizedToken === "t" || normalizedToken === "tobashi" || normalizedToken === "飛ばし") {
      tobashi = true;
      continue;
    }
    if (normalizedToken === "y" || normalizedToken === "yakitori" || normalizedToken === "焼き鳥") {
      yakitori = true;
    }
  }

  return {
    score,
    flags: {
      yakitori,
      tobi,
      tobashi,
      hasConflict: tobi && tobashi,
    },
  };
}

function findMainHeaderRow(matrix: string[][]): number {
  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 10); rowIndex += 1) {
    const row = matrix[rowIndex] ?? [];
    const first = normalizeForMatch(normalizeText(row[0]));
    if (first !== "player" && first !== "name" && first !== "プレーヤー" && first !== "プレイヤー" && first !== "氏名") continue;

    const hasGameNo = row.slice(1).some((cell) => {
      const gameNo = Number(normalizeText(cell));
      return Number.isInteger(gameNo) && gameNo >= MIN_GAME_NO && gameNo <= MAX_GAME_NO;
    });
    if (hasGameNo) return rowIndex;
  }
  return -1;
}

function collectGameColumns(header: string[]): Map<number, number> {
  const map = new Map<number, number>();
  for (let col = 1; col < header.length; col += 1) {
    const gameNo = Number(normalizeText(header[col]));
    if (!Number.isInteger(gameNo) || gameNo < MIN_GAME_NO || gameNo > MAX_GAME_NO) continue;
    map.set(gameNo, col);
  }
  return map;
}

function isYakumanHeaderRow(row: string[]): boolean {
  const first = normalizeForMatch(normalizeText(row[0]));
  const second = normalizeForMatch(normalizeText(row[1]));
  const third = normalizeForMatch(normalizeText(row[2]));

  return (first === "gameno" || first === "試合番号")
    && (second === "player" || second === "name" || second === "プレーヤー")
    && (third === "yakuman" || third === "役満");
}

function findYakumanHeaderRow(matrix: string[][], startRow: number): number {
  for (let rowIndex = startRow; rowIndex < matrix.length; rowIndex += 1) {
    if (isYakumanHeaderRow(matrix[rowIndex] ?? [])) return rowIndex;
  }
  return -1;
}

function resolveYakumanToken(token: string, yakumans: YakumanDef[]): YakumanDef | null {
  const normalized = normalizeForMatch(token);
  if (!normalized) return null;

  const byCode = yakumans.find((y) => normalizeForMatch(y.code) === normalized);
  if (byCode) return byCode;

  // 役満名 / コード（半角・全角スラッシュ両対応）を許容
  const slashToken = token.split(/[\/／]/).map((v) => v.trim()).find((part) => {
    const normalizedPart = normalizeForMatch(part);
    return yakumans.some((y) => normalizeForMatch(y.code) === normalizedPart);
  });
  if (slashToken) {
    const bySlash = yakumans.find((y) => normalizeForMatch(y.code) === normalizeForMatch(slashToken));
    if (bySlash) return bySlash;
  }

  const codePrefix = token.match(/^([A-Za-z0-9]{2,})\s*[:：\-]/);
  if (codePrefix) {
    const byPrefix = yakumans.find((y) => normalizeForMatch(y.code) === normalizeForMatch(codePrefix[1]));
    if (byPrefix) return byPrefix;
  }

  const byNameInclude = yakumans.find((y) => normalized.includes(normalizeForMatch(y.name)) || normalizeForMatch(y.name).includes(normalized));
  return byNameInclude ?? null;
}

function parseCount(raw: string): number {
  const value = normalizeText(raw);
  if (!value) return 1;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 1;
  return parsed;
}

function applyYakumanRows(
  games: ParsedSpreadsheetGame[],
  matrix: string[][],
  yakumanHeaderRow: number,
  yakumans: YakumanDef[],
  warnings: string[]
) {
  if (yakumanHeaderRow < 0) return;

  const gameMap = new Map<number, ParsedSpreadsheetGame>();
  for (const game of games) {
    gameMap.set(game.gameNo, game);
  }

  const dedupe = new Map<string, ParsedYakumanSelection>();

  for (let rowIndex = yakumanHeaderRow + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] ?? [];
    const gameNoRaw = normalizeText(row[0]);
    const playerName = normalizeText(row[1]);
    const yakumanRaw = normalizeText(row[2]);
    const countRaw = normalizeText(row[3]);

    if (!gameNoRaw && !playerName && !yakumanRaw && !countRaw) continue;

    // 最低限必須の3つのフィールドがない場合はスキップ（警告なし）
    if (!gameNoRaw || !playerName || !yakumanRaw) continue;

    const gameNo = Number(gameNoRaw);
    if (!Number.isInteger(gameNo) || gameNo < MIN_GAME_NO || gameNo > MAX_GAME_NO) {
      warnings.push(`役満テーブル${rowIndex + 1}行目: gameNo が不正です`);
      continue;
    }

    const game = gameMap.get(gameNo);
    if (!game) {
      warnings.push(`役満テーブル${rowIndex + 1}行目: 対応する試合${gameNo}が見つかりません`);
      continue;
    }

    if (!game.players.includes(playerName)) {
      warnings.push(`役満テーブル${rowIndex + 1}行目: ${playerName} は試合${gameNo}の参加者ではありません`);
      continue;
    }

    const resolved = resolveYakumanToken(yakumanRaw, yakumans);
    if (!resolved) {
      warnings.push(`役満テーブル${rowIndex + 1}行目: 役満が解決できません (${yakumanRaw})`);
      continue;
    }

    const count = parseCount(countRaw);
    const key = `${gameNo}|${normalizeForMatch(playerName)}|${resolved.code}`;
    const existing = dedupe.get(key);

    if (existing) {
      existing.count += count;
      continue;
    }

    const selection: ParsedYakumanSelection = {
      playerName,
      yakumanCode: resolved.code,
      yakumanName: resolved.name,
      points: resolved.points,
      count,
    };

    game.yakumanSelections.push(selection);
    dedupe.set(key, selection);
  }
}

export function parseSpreadsheetMatrix(
  matrix: string[][],
  sheetTitle: string,
  yakumans: YakumanDef[]
): ParsedSpreadsheetPayload {
  if (!Array.isArray(matrix) || matrix.length < 2) {
    return { sheetTitle, inferredDate: parseGameDateFromTitle(sheetTitle), games: [], warnings: ["シートの行数が不足しています。"] };
  }

  const warnings: string[] = [];
  const headerRowIndex = findMainHeaderRow(matrix);
  if (headerRowIndex < 0) {
    return { sheetTitle, inferredDate: parseGameDateFromTitle(sheetTitle), games: [], warnings: ["主表ヘッダー（player + 1..40）が見つかりません。"] };
  }

  const header = matrix[headerRowIndex] ?? [];
  const gameColumns = collectGameColumns(header);
  const gameNos = Array.from(gameColumns.keys()).sort((a, b) => a - b);

  if (gameNos.length === 0) {
    return { sheetTitle, inferredDate: parseGameDateFromTitle(sheetTitle), games: [], warnings: ["試合列（1..40）が見つかりません。"] };
  }

  const yakumanHeaderRow = findYakumanHeaderRow(matrix, headerRowIndex + 1);

  const playerRows = matrix
    .slice(headerRowIndex + 1, yakumanHeaderRow >= 0 ? yakumanHeaderRow : matrix.length)
    .map((row) => ({ name: normalizeText(row[0]), row }))
    .filter((entry) => Boolean(entry.name));

  const games: ParsedSpreadsheetGame[] = [];

  for (const gameNo of gameNos) {
    const col = gameColumns.get(gameNo);
    if (col === undefined) continue;

    const players: string[] = [];
    const scores: number[] = [];
    const yakitoriPlayers: string[] = [];
    const tobiPlayers: string[] = [];
    const tobashiPlayers: string[] = [];
    const conflictingFlagPlayers: string[] = [];
    const yakumanSelections: ParsedYakumanSelection[] = [];

    for (const { name, row } of playerRows) {
      const parsedCell = parseCellValue(normalizeText(row[col]));
      if (parsedCell.score === null) continue;

      players.push(name);
      scores.push(parsedCell.score);

      if (parsedCell.flags.yakitori) yakitoriPlayers.push(name);
      if (parsedCell.flags.tobi) tobiPlayers.push(name);
      if (parsedCell.flags.tobashi) tobashiPlayers.push(name);
      if (parsedCell.flags.hasConflict) conflictingFlagPlayers.push(name);
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
      conflictingFlagPlayers,
      yakumanSelections,
      gameType: players.length === 4 ? "4p" : "3p",
    });

    if (conflictingFlagPlayers.length > 0) {
      warnings.push(`試合${gameNo}: 飛び/飛ばし競合 (${conflictingFlagPlayers.join(", ")})`);
    }
  }

  applyYakumanRows(games, matrix, yakumanHeaderRow, yakumans, warnings);

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
