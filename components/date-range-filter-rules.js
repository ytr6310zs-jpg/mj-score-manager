export function getDefaultMinGamesForFilter(filter) {
  return filter === "year" ? "20" : "";
}

export function shouldShowMinGames(showMinGames, filter) {
  return Boolean(showMinGames) && (filter === "year" || filter === "custom");
}

export function shouldAutoSubmitOnMinGamesChange(filter) {
  return filter === "year";
}

export function getLoadingIndicatorPlacement(filter) {
  if (filter === "year") return "minGamesRight";
  if (filter === "custom") return "submitButtonRight";
  return "filterRight";
}
