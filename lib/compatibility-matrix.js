// Pure computation for compatibility (head-to-head) matrix
// Used by lib/compatibility.ts and unit tests

/**
 * @typedef {{ wins: number; losses: number; draws: number }} MatchupRecord
 * @typedef {{ players: string[]; matrix: Map<string, Map<string, MatchupRecord>> }} CompatibilityResult
 */

/**
 * 勝率を計算する。wins + losses = 0 の場合は 0 を返す。
 * @param {MatchupRecord} record
 * @returns {number}
 */
export function computeWinRate(record) {
  const total = record.wins + record.losses;
  return total === 0 ? 0 : (record.wins / total) * 100;
}

/**
 * @param {Map<string, Map<string, MatchupRecord>>} matrix
 * @param {string} rowPlayer
 * @param {string} colPlayer
 * @returns {MatchupRecord}
 */
function getOrCreateRecord(matrix, rowPlayer, colPlayer) {
  if (!matrix.has(rowPlayer)) {
    matrix.set(rowPlayer, new Map());
  }
  const row = matrix.get(rowPlayer);
  if (!row.has(colPlayer)) {
    row.set(colPlayer, { wins: 0, losses: 0, draws: 0 });
  }
  return row.get(colPlayer);
}

/**
 * MatchResult[] からプレーヤー間の勝敗マトリクスを構築する。
 * rank が 0 または name が空のエントリはスキップする。
 *
 * @param {Array<{ players: Array<{ name: string; rank: number }> }>} matches
 * @returns {CompatibilityResult}
 */
export function buildCompatibilityMatrix(matches) {
  /** @type {Map<string, Map<string, MatchupRecord>>} */
  const matrix = new Map();
  const playerSet = new Set();

  for (const match of matches) {
    // 有効なプレーヤーのみ（name と rank が有効な正の整数）
    const validPlayers = match.players.filter((p) => p.name && p.rank > 0);

    for (let i = 0; i < validPlayers.length; i++) {
      for (let j = i + 1; j < validPlayers.length; j++) {
        const a = validPlayers[i];
        const b = validPlayers[j];

        playerSet.add(a.name);
        playerSet.add(b.name);

        if (a.rank < b.rank) {
          // a が上位 → a 勝ち、b 負け
          getOrCreateRecord(matrix, a.name, b.name).wins += 1;
          getOrCreateRecord(matrix, b.name, a.name).losses += 1;
        } else if (a.rank > b.rank) {
          // b が上位 → b 勝ち、a 負け
          getOrCreateRecord(matrix, b.name, a.name).wins += 1;
          getOrCreateRecord(matrix, a.name, b.name).losses += 1;
        } else {
          // 同着順 → 分け
          getOrCreateRecord(matrix, a.name, b.name).draws += 1;
          getOrCreateRecord(matrix, b.name, a.name).draws += 1;
        }
      }
    }
  }

  const players = Array.from(playerSet).sort((a, b) => a.localeCompare(b, "ja"));

  return { players, matrix };
}

/**
 * buildCompatibilityMatrix の結果から minGames 未満の参加数プレーヤーを除外する。
 * matches は buildCompatibilityMatrix に渡したものと同一のデータを使用する。
 *
 * @param {{ players: string[]; matrix: Map<string, Map<string, MatchupRecord>> }} result
 * @param {Array<{ players: Array<{ name: string; rank: number }> }>} matches
 * @param {number} minGames
 * @returns {{ players: string[]; matrix: Map<string, Map<string, MatchupRecord>> }}
 */
export function filterCompatibilityByMinGames(result, matches, minGames) {
  const gameCountMap = new Map();
  for (const match of matches) {
    for (const player of match.players) {
      if (player.name && player.rank > 0) {
        gameCountMap.set(player.name, (gameCountMap.get(player.name) ?? 0) + 1);
      }
    }
  }
  const eligible = result.players.filter((p) => (gameCountMap.get(p) ?? 0) >= minGames);
  const filteredMatrix = new Map(
    eligible.map((p) => [
      p,
      new Map(
        eligible.map((q) => [q, result.matrix.get(p)?.get(q) ?? { wins: 0, losses: 0, draws: 0 }]),
      ),
    ]),
  );
  return { players: eligible, matrix: filteredMatrix };
}
