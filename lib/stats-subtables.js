/**
 * Compute subtables from an array of MatchResult objects.
 * Returns yakuman events, highest/lowest score ranks and largest spreads.
 */
export function computeSubtablesFromMatches(matches = [], topN = 20) {
  const yakumanEvents = [];
  const scoreEntries = [];
  const spreadEntries = [];

  for (const m of matches) {
    const players = Array.isArray(m.players) ? m.players : [];
    if (players.length === 0) continue;

    for (const p of players) {
      scoreEntries.push({
        date: m.date || "",
        createdAt: m.createdAt || "",
        playerName: p.name,
        score: Number(p.score ?? 0),
        gameId: m.id,
        gameType: m.gameType,
      });

      if (Array.isArray(p.yakumans)) {
        for (const y of p.yakumans) {
          yakumanEvents.push({
            date: m.date || "",
            createdAt: m.createdAt || "",
            playerName: p.name,
            yakumanName: y.name || String(y),
            points: y.points === undefined ? null : Number(y.points),
            gameId: m.id,
            gameType: m.gameType,
          });
        }
      }
    }

    const scores = players.map((p) => Number(p.score ?? 0));
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const topPlayer = players.find((p) => Number(p.score ?? 0) === max);
    const lastPlayer = players.find((p) => Number(p.score ?? 0) === min);
    spreadEntries.push({
      date: m.date || "",
      createdAt: m.createdAt || "",
      topPlayerName: topPlayer ? topPlayer.name : "",
      lastPlayerName: lastPlayer ? lastPlayer.name : "",
      spread: max - min,
      gameId: m.id,
      gameType: m.gameType,
    });
  }

  // sorting helpers
  const byCreatedDesc = (a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");

  const highestScores = scoreEntries
    .slice()
    .sort((a, b) => (b.score - a.score) || byCreatedDesc(a, b))
    .slice(0, topN);

  const lowestScores = scoreEntries
    .slice()
    .sort((a, b) => (a.score - b.score) || byCreatedDesc(a, b))
    .slice(0, topN);

  const largestSpreads = spreadEntries
    .slice()
    .sort((a, b) => (b.spread - a.spread) || byCreatedDesc(a, b))
    .slice(0, topN);

  yakumanEvents.sort(byCreatedDesc);

  return {
    yakumanEvents: yakumanEvents.slice(0, topN),
    highestScores,
    lowestScores,
    largestSpreads,
  };
}

export async function fetchStatsSubtables(startDate, endDate, topN = 20) {
  try {
    // dynamic import to avoid top-level resolution issues during node tests
    const mod = await import("./matches");
    const { fetchMatchResults } = mod;
    if (typeof fetchMatchResults !== "function") {
      return { yakumanEvents: [], highestScores: [], lowestScores: [], largestSpreads: [], error: "fetchMatchResults not available" };
    }
    const { matches, error } = await fetchMatchResults(startDate, endDate);
    if (error) {
      return { yakumanEvents: [], highestScores: [], lowestScores: [], largestSpreads: [], error };
    }
    const res = computeSubtablesFromMatches(matches, topN);
    return { ...res, error: null };
  } catch (err) {
    return { yakumanEvents: [], highestScores: [], lowestScores: [], largestSpreads: [], error: String(err) };
  }
}

export default computeSubtablesFromMatches;
