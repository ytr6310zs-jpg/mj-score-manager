import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertYakumanOccurrences(
  supabase: SupabaseClient,
  newGameId: number,
  yakumanSelectionsRaw: string | undefined
) {
  const yakRows: Array<Record<string, unknown>> = [];
  const raw = String(yakumanSelectionsRaw ?? "").trim();
  let yakumanSelections: Array<{ playerName: string; yakumanCode: string; yakumanName: string }> = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        yakumanSelections = parsed
          .map((entry) => {
            const e = entry as Record<string, unknown>;
            return {
              playerName: String(e.playerName ?? "").trim(),
              yakumanCode: String(e.yakumanCode ?? "").trim(),
              yakumanName: String(e.yakumanName ?? "").trim(),
            };
          })
          .filter((entry) => entry.playerName && entry.yakumanCode && entry.yakumanName);
      }
    } catch {
      yakumanSelections = [];
    }
  }

  if (yakumanSelections.length === 0) return;

  const namesToResolve = new Set(yakumanSelections.map((entry) => entry.playerName));
  const namesArr = Array.from(namesToResolve);
  const { data: playersRows, error: playersErr } = await supabase.from("players").select("id,name").in("name", namesArr);
  if (!playersErr && playersRows && Array.isArray(playersRows)) {
    const nameToId = new Map<string, number>();
    for (const r of playersRows) {
      const nm = String(r["name"] ?? "");
      const id = Number((r as Record<string, unknown>)["id"] ?? 0);
      if (nm) nameToId.set(nm, id);
    }

    // Attempt to resolve yakuman type definitions from yakuman_types table.
    const codesToResolve = Array.from(new Set(yakumanSelections.map((e) => e.yakumanCode)));
    const codeToDef = new Map<string, { name: string; points: number | null }>();
    try {
      if (codesToResolve.length > 0) {
        const { data: yakTypesRows, error: yakTypesErr } = await supabase
          .from("yakuman_types")
          .select("code,name,points")
          .in("code", codesToResolve as string[]);
        if (!yakTypesErr && yakTypesRows && Array.isArray(yakTypesRows)) {
          for (const r of yakTypesRows) {
            const code = String((r as Record<string, unknown>)["code"] ?? "");
            const name = String((r as Record<string, unknown>)["name"] ?? "");
            const pts = (r as Record<string, unknown>)["points"];
            codeToDef.set(code, { name, points: pts === null || pts === undefined ? null : Number(pts) });
          }
        }
      }
    } catch (e) {
      console.warn("yakuman_types resolution failed, falling back to submitted names/points", e);
    }

    for (const entry of yakumanSelections) {
      const pid = nameToId.get(entry.playerName);
      if (!pid) {
        console.warn("player id not found for yakuman insertion:", entry.playerName);
        continue;
      }
      const def = codeToDef.get(entry.yakumanCode);
      yakRows.push({
        game_id: newGameId,
        player_id: pid,
        yakuman_code: entry.yakumanCode,
        yakuman_name: def?.name ?? entry.yakumanName,
        points: def?.points ?? null,
        meta: def ? { source: "yakuman_types" } : null,
      });
    }
  }

  if (yakRows.length > 0) {
    const { error: yakInsertErr } = await supabase.from("yakuman_occurrences").insert(yakRows);
    if (yakInsertErr) {
      console.error("yakuman insert error:", yakInsertErr);
    }
  }
}

export async function insertYakumanTypes(supabase: SupabaseClient) {
  const desired = [
    { code: "ST", name: "四暗刻単騎", points: 32000, description: "四暗刻単騎 (Su Anko Tanki)", sort_order: 22 },
    { code: "KZ", name: "数え役満", points: 32000, description: "数え役満 (Kazoe Yakuman)", sort_order: 8 },
  ];

  const { data: existingRows, error: selectErr } = await supabase.from("yakuman_types").select("code");
  if (selectErr) {
    console.error("yakuman_types select error:", selectErr);
    return;
  }

  const existingCodes = new Set<string>(((existingRows ?? []) as Array<Record<string, unknown>>).map((r) => String(r.code ?? "").trim()));
  const toInsert = desired.filter((d) => !existingCodes.has(d.code));
  if (toInsert.length === 0) {
    console.log("insertYakumanTypes: no new types to insert");
    return;
  }

  const { error: insertErr } = await supabase.from("yakuman_types").insert(toInsert);
  if (insertErr) {
    console.error("insert yakuman_types error:", insertErr);
  } else {
    console.log(`insertYakumanTypes: inserted ${toInsert.length} rows`);
  }
}
