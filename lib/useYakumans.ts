"use client";

import type { YakumanDef } from "@/lib/yakumans";
import { YAKUMANS } from "@/lib/yakumans";
import { useEffect, useState } from "react";

type UseYakumansResult = {
  yakumans: YakumanDef[];
  loading: boolean;
  error: string | null;
};

export default function useYakumans(): UseYakumansResult {
  const [yakumans, setYakumans] = useState<YakumanDef[]>(YAKUMANS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/yakumans")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || "fetch error");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setYakumans(
            data.map((d: unknown) => {
              const rec = d as Record<string, unknown>;
              return {
                code: String(rec["code"] ?? ""),
                name: String(rec["name"] ?? ""),
                points:
                  rec["points"] === null || rec["points"] === undefined ? null : Number(rec["points"]),
              } as YakumanDef;
            })
          );
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { yakumans, loading, error };
}
