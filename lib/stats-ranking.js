/**
 * Sort rows by score desc and assign Excel-like competition ranks.
 * Ties receive the same rank and the next rank is skipped.
 */
export function sortAndAssignCompetitionRank(rows = []) {
  const sorted = rows
    .slice()
    .sort((a, b) => (b.totalScore - a.totalScore) || String(a.name).localeCompare(String(b.name), "ja"));

  let previousScore = null;
  let previousRank = 0;

  return sorted.map((row, index) => {
    const rank = previousScore === row.totalScore ? previousRank : index + 1;
    previousScore = row.totalScore;
    previousRank = rank;
    return { ...row, rank };
  });
}

export default sortAndAssignCompetitionRank;
