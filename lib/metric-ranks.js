// Helper utilities for metric ranking (used by UI and tests)
export const METRIC_DIRECTION = {
  games: "desc",
  topCount: "desc",
  topRate: "desc",
  secondRate: "desc",
  thirdRate: "desc",
  lastAvoidanceRate: "desc",
  tobashiCount: "desc",
  yakumanCount: "desc",
  tobashiRate: "desc",
  tobiAvoidanceRate: "desc",
  yakitoriAvoidanceRate: "desc",
  setaiRate: "desc",
  // lastCount is better when smaller
  lastCount: "asc",
};

export const METRICS_TO_HIGHLIGHT = Object.keys(METRIC_DIRECTION);

function getMetricValue(p, metric) {
  const v = p && p[metric];
  if (v === undefined || v === null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

/**
 * computeTopSets(stats, metrics, metricDir)
 * returns: { [metric]: { first: string[], second: string[], third: string[] } }
 */
export function computeTopSets(stats = [], metrics = METRICS_TO_HIGHLIGHT, metricDir = METRIC_DIRECTION) {
  const out = {};

  for (const metric of metrics) {
    const arr = stats.map((s) => ({ name: s.name, value: getMetricValue(s, metric) }));
    const dir = metricDir[metric] ?? "desc";
    arr.sort((a, b) => {
      const byValue = dir === "desc" ? b.value - a.value : a.value - b.value;
      if (byValue !== 0) return byValue;
      return String(a.name).localeCompare(String(b.name), "ja");
    });

    // competition rank (Excel RANK style): 1, 1, 3, 4 ...
    let prevValue;
    let prevRank = 0;
    const ranked = arr.map((item, index) => {
      const rank = prevValue === item.value ? prevRank : index + 1;
      prevValue = item.value;
      prevRank = rank;
      return { ...item, rank };
    });

    const first = ranked.filter((x) => x.rank === 1).map((x) => x.name);
    const second = ranked.filter((x) => x.rank === 2).map((x) => x.name);
    const third = ranked.filter((x) => x.rank === 3).map((x) => x.name);

    out[metric] = { first, second, third };
  }

  return out;
}
