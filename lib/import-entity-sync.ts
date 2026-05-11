export type YakumanSelectionInput = {
  playerName: string;
  yakumanCode: string;
  yakumanName: string;
};

export type ImportEntitySourceRow = {
  rowId: number;
  players: string[];
  matchedPlayers: string[];
  yakumanSelections: YakumanSelectionInput[];
};

export type YakumanTypeInsertRow = {
  code: string;
  name: string;
  points: number;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export function collectImportEntitiesForSelectedRows(
  rows: ImportEntitySourceRow[],
  selectedIds: Set<number>
): { playerNames: string[]; yakumanCodeToName: Map<string, string> } {
  const playerNames = new Set<string>();
  const yakumanCodeToName = new Map<string, string>();

  for (const row of rows) {
    if (!selectedIds.has(row.rowId)) continue;

    for (const player of row.players) {
      const name = player.trim();
      if (name) playerNames.add(name);
    }

    for (const selection of row.yakumanSelections) {
      const playerIndex = row.players.indexOf(selection.playerName);
      if (playerIndex < 0) continue;

      const mappedPlayer = row.matchedPlayers[playerIndex] ?? row.players[playerIndex] ?? "";
      if (!mappedPlayer.trim()) continue;

      const code = selection.yakumanCode.trim();
      if (!code) continue;

      const name = selection.yakumanName.trim() || code;
      if (!yakumanCodeToName.has(code)) {
        yakumanCodeToName.set(code, name);
      }
    }
  }

  return {
    playerNames: Array.from(playerNames),
    yakumanCodeToName,
  };
}

export function buildMissingPlayerInsertRows(
  allPlayerNames: string[],
  existingPlayerNames: string[]
): Array<{ name: string }> {
  const existing = new Set(existingPlayerNames.map((name) => name.trim()).filter(Boolean));
  return allPlayerNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !existing.has(name))
    .map((name) => ({ name }));
}

export function buildMissingYakumanTypeInsertRows(
  yakumanCodeToName: Map<string, string>,
  existingCodes: string[],
  maxSortOrder: number
): YakumanTypeInsertRow[] {
  const existing = new Set(existingCodes.map((code) => code.trim()).filter(Boolean));
  const missingCodes = Array.from(yakumanCodeToName.keys()).filter((code) => !existing.has(code));

  return missingCodes.map((code, index) => ({
    code,
    name: yakumanCodeToName.get(code) ?? code,
    points: 32000,
    description: "",
    sort_order: maxSortOrder + 10 * (index + 1),
    is_active: true,
  }));
}
