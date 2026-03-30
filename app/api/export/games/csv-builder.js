function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build CSV string from matches array.
 * @param {Array} matches
 * @param {{start?:string,end?:string}} opts
 * @returns {{csv:string, filename:string}}
 */
export function buildGamesCsv(matches, opts = {}) {
  const headers = [
    "match_id",
    "match_date",
    "tournament",
    "venue",
    "round_number",
    "table",
    "rule_set",
    "players_count",
    "player_1_id",
    "player_1_name",
    "player_1_seat",
    "player_1_score_change",
    "player_1_final_score",
    "player_2_id",
    "player_2_name",
    "player_2_seat",
    "player_2_score_change",
    "player_2_final_score",
    "player_3_id",
    "player_3_name",
    "player_3_seat",
    "player_3_score_change",
    "player_3_final_score",
    "player_4_id",
    "player_4_name",
    "player_4_seat",
    "player_4_score_change",
    "player_4_final_score",
    "notes",
    "metadata_json",
    "export_version",
  ];

  const rows = [headers.join(",")];

  for (const m of matches) {
    const matchId = m.createdAt || "";
    const base = [
      escapeCsv(matchId),
      escapeCsv(m.date ?? ""),
      escapeCsv("") /* tournament */,
      escapeCsv("") /* venue */,
      escapeCsv("") /* round_number */,
      escapeCsv("") /* table */,
      escapeCsv("") /* rule_set */,
      escapeCsv(m.playerCount ?? (m.players?.length ?? 0)),
    ];

    const players = (m.players || []).slice(0, 4);
    const cols = [];
    for (let i = 0; i < 4; i++) {
      const p = players[i];
      if (p) {
        cols.push(escapeCsv(p.id ?? ""));
        cols.push(escapeCsv(p.name ?? ""));
        cols.push(escapeCsv(p.slot ?? ""));
        cols.push(escapeCsv(p.score ?? ""));
        cols.push(escapeCsv(p.score ?? ""));
      } else {
        cols.push("", "", "", "", "");
      }
    }

    const metadata = {
      source: "sheets",
      sheet: process.env.GOOGLE_SHEET_TITLE ?? null,
    };

    const tail = [escapeCsv(m.notes ?? ""), escapeCsv(JSON.stringify(metadata)), escapeCsv("v1")];

    rows.push([...base, ...cols, ...tail].join(","));
  }

  const csv = rows.join("\r\n");
  const filename = `games_${opts.start || "all"}_${opts.end || "all"}.csv`;
  return { csv, filename };
}

// no default export to keep named exports only
