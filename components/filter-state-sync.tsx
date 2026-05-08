"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  readSharedFilterState,
  writeSharedFilterState,
  buildSharedFilterSearchParams,
  hasExplicitParams,
} from "@/lib/filter-state-preference";

type Props = {
  includeMinGames: boolean;
};

const today = new Date();
const YEAR_START = `${today.getFullYear()}-01-01`;
const YEAR_END = `${today.getFullYear()}-12-31`;

/** URL の filter 値から start/end を決定する */
function resolveStartEnd(
  filterValue: string | null,
  paramStart: string | null,
  paramEnd: string | null,
): { start: string; end: string } {
  if (!filterValue) return { start: "", end: "" };
  if (filterValue === "year") return { start: YEAR_START, end: YEAR_END };
  if (filterValue === "custom") return { start: paramStart ?? "", end: paramEnd ?? "" };
  // 日付単一（YYYY-MM-DD）
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(filterValue)) return { start: filterValue, end: filterValue };
  return { start: "", end: "" };
}

export default function FilterStateSync({ includeMinGames }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const replacedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const explicit = hasExplicitParams(params, pathname);
    const stored = readSharedFilterState();

    if (explicit) {
      // URL の明示パラメータを正として保存状態を更新する
      const filterVal = params.get("filter") ?? stored?.filter ?? "year";
      const { start, end } = resolveStartEnd(filterVal, params.get("start"), params.get("end"));
      const next = {
        filter: filterVal,
        start,
        end,
        tournamentId: params.get("tournamentId") ?? stored?.tournamentId,
        minGames: includeMinGames
          ? (params.get("minGames") ?? stored?.minGames)
          : stored?.minGames,
      };
      try {
        writeSharedFilterState(next);
      } catch {
        // ignore
      }
      return;
    }

    // 明示パラメータなし: 保存済み状態を URL に反映（1回のみ）
    if (stored && !replacedRef.current) {
      const builtParams = buildSharedFilterSearchParams(stored, { includeMinGames });
      replacedRef.current = true;
      router.replace(`${pathname}?${builtParams.toString()}`);
    }
  }, [includeMinGames, pathname, router, searchParams]);

  return null;
}
