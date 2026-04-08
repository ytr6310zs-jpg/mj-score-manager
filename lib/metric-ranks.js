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
    arr.sort((a, b) => (dir === "desc" ? b.value - a.value : a.value - b.value));

    // collect up to 3 distinct values
    const uniq = [];
    for (const it of arr) {
      if (!uniq.includes(it.value)) uniq.push(it.value);
      if (uniq.length >= 3) break;
    }

    const firstV = uniq[0];
    const secondV = uniq[1];
    const thirdV = uniq[2];

    const first = arr.filter((x) => x.value === firstV).map((x) => x.name);
    const second = secondV === undefined ? [] : arr.filter((x) => x.value === secondV).map((x) => x.name);
    const third = thirdV === undefined ? [] : arr.filter((x) => x.value === thirdV).map((x) => x.name);

    out[metric] = { first, second, third };
  }

  return out;
}
