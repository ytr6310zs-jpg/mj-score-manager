export type RankSets = { first: string[]; second: string[]; third: string[] };

export const METRIC_DIRECTION: Record<string, 'asc' | 'desc'>;
export const METRICS_TO_HIGHLIGHT: string[];

export function computeTopSets(
  stats: Array<Record<string, unknown>>,
  metrics?: string[],
  metricDir?: Record<string, 'asc' | 'desc'>
): Record<string, RankSets>;
