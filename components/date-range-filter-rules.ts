export function getDefaultMinGamesForFilter(filter: string): string {
  return filter === "year" ? "20" : "";
}

export function shouldShowMinGames(showMinGames: boolean, filter: string): boolean {
  return Boolean(showMinGames) && (filter === "year" || filter === "custom");
}

export function shouldAutoSubmitOnMinGamesChange(filter: string): boolean {
  return filter === "year";
}

export function getLoadingIndicatorPlacement(filter: string): "minGamesRight" | "submitButtonRight" | "filterRight" {
  if (filter === "year") return "minGamesRight";
  if (filter === "custom") return "submitButtonRight";
  return "filterRight";
}
