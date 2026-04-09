type PlayerStatRow = {
  name: string;
  rank: number;
  totalScore: number;
  games: number;
  topCount: number;
  lastCount: number;
  secondRate: number;
  thirdRate: number;
  tobashiCount: number;
  tobiCount: number;
  yakitoriCount: number;
  yakumanCount: number;
  topRate: number;
  lastAvoidanceRate: number;
  tobashiRate: number;
  tobiAvoidanceRate: number;
  yakitoriAvoidanceRate: number;
  setaiRate: number;
};

export function buildStatsCsv(stats: PlayerStatRow[], opts?: { start?: string; end?: string }): { csv: string; filename: string };
