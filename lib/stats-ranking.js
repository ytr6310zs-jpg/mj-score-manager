/**
 * Sort rows by score desc and assign Excel-like competition ranks.
 * Ties receive the same rank and the next rank is skipped.
 * Equality uses tenth-integer keys so 0.1+0.2 style float drift does not break ties.
 */
function scoreToTenths(value) {
  return Math.round(Number(value) * 10);
}

export function sortAndAssignCompetitionRank(rows = []) {
  const sorted = rows
    .slice()
    .sort(
      (a, b) =>
        scoreToTenths(b.totalScore) - scoreToTenths(a.totalScore) ||
        String(a.name).localeCompare(String(b.name), "ja")
    );

  let previousTenths = null;
  let previousRank = 0;

  return sorted.map((row, index) => {
    const tenths = scoreToTenths(row.totalScore);
    const rank = previousTenths === tenths ? previousRank : index + 1;
    previousTenths = tenths;
    previousRank = rank;
    return { ...row, rank };
  });
}

export default sortAndAssignCompetitionRank;
