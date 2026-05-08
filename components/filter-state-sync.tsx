"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readSharedFilterState, buildSharedFilterSearchParams, hasExplicitParams, SharedFilterState } from "@/lib/filter-state-preference";

type Props = {
  includeMinGames: boolean;
};

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
      // sync URL -> storage
      if (stored) {
        // merge: create SharedFilterState from params then write
        const merged: Partial<SharedFilterState> = { filter: params.get("filter") ?? stored.filter };
        if (params.get("filter") === "custom") {
          merged.start = params.get("start") ?? stored.start;
          merged.end = params.get("end") ?? stored.end;
        } else if (params.get("filter") && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(params.get("filter") ?? "")) {
          merged.start = params.get("filter") ?? stored.start;
          merged.end = params.get("filter") ?? stored.end;
        }
        if (params.get("tournamentId")) merged.tournamentId = params.get("tournamentId") ?? undefined;
        if (includeMinGames && params.get("minGames")) merged.minGames = params.get("minGames") ?? undefined;
        try {
          // write merged (fill missing from stored)
          const next: SharedFilterState = {
            filter: (merged.filter ?? stored.filter) as string,
            start: (merged.start ?? stored.start) as string,
            end: (merged.end ?? stored.end) as string,
            tournamentId: merged.tournamentId ?? stored.tournamentId,
            minGames: includeMinGames ? merged.minGames ?? stored.minGames : stored.minGames,
          };
          import("@/lib/filter-state-preference").then((m) => m.writeSharedFilterState(next)).catch(() => {});
        } catch {
          // ignore
        }
      } else if (params.toString()) {
        // no stored, but explicit; create minimal stored
        const created: SharedFilterState = {
          filter: params.get("filter") ?? "year",
          start: params.get("start") ?? "",
          end: params.get("end") ?? "",
          tournamentId: params.get("tournamentId") ?? undefined,
          minGames: includeMinGames ? params.get("minGames") ?? undefined : undefined,
        };
        try {
          import("@/lib/filter-state-preference").then((m) => m.writeSharedFilterState(created)).catch(() => {});
        } catch {}
      }
      return;
    }

    // not explicit: if stored exists, replace URL once to reflect stored
    if (!explicit && stored && !replacedRef.current) {
      const params = buildSharedFilterSearchParams(stored, { includeMinGames });
      replacedRef.current = true;
      const href = `${pathname}?${params.toString()}`;
      router.replace(href);
    }
  }, [includeMinGames, pathname, router, searchParams]);

  return null;
}
