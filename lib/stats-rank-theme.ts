// Shared rank badge and row background styles for stats UI
export const RANK_BADGE: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-slate-300 text-slate-800",
  3: "bg-orange-400 text-orange-950",
};

export const RANK_ROW_BG: Record<number, string> = {
  1: "bg-yellow-50",
  2: "bg-slate-50",
  3: "bg-orange-50/70",
};

export default { RANK_BADGE, RANK_ROW_BG };
