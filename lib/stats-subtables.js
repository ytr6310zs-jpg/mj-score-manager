/**
 * Compute subtables from an array of MatchResult objects.
 * Returns yakuman events, highest/lowest score ranks and largest spreads.
 */
export function computeSubtablesFromMatches(matches = [], topN = 20, options = {}) {
  const yakumanEvents = [];
  const spreadEntries = [];
  const playerMap = new Map();

  for (const m of matches) {
    const players = Array.isArray(m.players) ? m.players : [];
    if (players.length === 0) continue;

    for (const p of players) {
      const playerName = p.name ?? "";
      if (!playerName) continue;
      const score = Number(p.score ?? 0);
      const entry = {
        date: m.date || "",
        createdAt: m.createdAt || "",
        playerName,
        score,
        gameId: m.id,
        gameType: m.gameType,
      };

      // yakuman events
      if (Array.isArray(p.yakumans)) {
        for (const y of p.yakumans) {
          yakumanEvents.push({
            date: m.date || "",
            createdAt: m.createdAt || "",
            playerName,
            yakumanName: y.name || String(y),
            points: y.points === undefined ? null : Number(y.points),
            gameId: m.id,
            gameType: m.gameType,
          });
        }
      }

      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          count: 0,
          maxEntry: entry,
          minEntry: entry,
        });
      }
      const rec = playerMap.get(playerName);
      rec.count = (rec.count || 0) + 1;

      // update maxEntry (prefer newer createdAt on tie)
      if (
        entry.score > rec.maxEntry.score ||
        (entry.score === rec.maxEntry.score && Date.parse(entry.createdAt || "") > Date.parse(rec.maxEntry.createdAt || ""))
      ) {
        rec.maxEntry = entry;
      }

      // update minEntry (prefer newer createdAt on tie)
      if (
        entry.score < rec.minEntry.score ||
        (entry.score === rec.minEntry.score && Date.parse(entry.createdAt || "") > Date.parse(rec.minEntry.createdAt || ""))
      ) {
        rec.minEntry = entry;
      }
    }

    // spread per match
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

  // determine eligiblePlayers set if provided
  const eligiblePlayers = options && options.eligiblePlayers instanceof Set ? options.eligiblePlayers : null;

  // build per-player candidate lists
  const maxCandidates = [];
  const minCandidates = [];
  for (const [name, rec] of playerMap.entries()) {
    if (eligiblePlayers && !eligiblePlayers.has(name)) continue;
    if (rec.maxEntry) maxCandidates.push(rec.maxEntry);
    if (rec.minEntry) minCandidates.push(rec.minEntry);
  }

  const byCreatedDesc = (a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
  const byPlayerNameAsc = (a, b) => String(a.playerName || "").localeCompare(String(b.playerName || ""));

  const highestScores = maxCandidates
    .slice()
    .sort((a, b) => (b.score - a.score) || byCreatedDesc(a, b) || byPlayerNameAsc(a, b));

  // lowestScores: compare player-level minima but order by higher minima first
  const lowestScores = minCandidates
    .slice()
    .sort((a, b) => (b.score - a.score) || byCreatedDesc(a, b) || byPlayerNameAsc(a, b));

  const largestSpreads = spreadEntries
    .slice()
    .sort((a, b) => (b.spread - a.spread) || byCreatedDesc(a, b))
    .slice(0, topN);

  yakumanEvents.sort(byCreatedDesc);

  return {
    yakumanEvents,
    highestScores,
    lowestScores,
    largestSpreads,
  };
}

export async function fetchStatsSubtables(startDate, endDate, topN = 20, options = {}) {
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

    // build eligiblePlayers set from minGames if provided
    let eligiblePlayers = null;
    if (options && typeof options.minGames === "number") {
      const counts = new Map();
      for (const m of matches) {
        const players = Array.isArray(m.players) ? m.players : [];
        for (const p of players) {
          const name = p.name ?? "";
          if (!name) continue;
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      }
      eligiblePlayers = new Set();
      for (const [name, cnt] of counts.entries()) {
        if (cnt >= options.minGames) eligiblePlayers.add(name);
      }
    }

    const res = computeSubtablesFromMatches(matches, topN, { eligiblePlayers });
    return { ...res, error: null };
  } catch (err) {
    return { yakumanEvents: [], highestScores: [], lowestScores: [], largestSpreads: [], error: String(err) };
  }
}

export default computeSubtablesFromMatches;
