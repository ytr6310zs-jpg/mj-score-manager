export type ScoreRow = {
  name: string;
  totalScore: number;
  [key: string]: unknown;
};

export type RankedScoreRow<T extends ScoreRow> = T & {
  rank: number;
};

export function sortAndAssignCompetitionRank<T extends ScoreRow>(rows?: T[]): RankedScoreRow<T>[];

export default sortAndAssignCompetitionRank;
