"use client";

import { useCallback, useEffect, useState } from "react";

type Mode = "today" | "thisYear" | "range";

type Props = {
  initialMode?: Mode;
  initialStart?: string | null;
  initialEnd?: string | null;
  initialToday?: boolean; // backward compatibility
  actionPath?: string;
};

export default function DateRangeFilter({ initialMode, initialStart, initialEnd, initialToday, actionPath }: Props) {
  const computeInitialMode = (): Mode => {
    if (initialMode === "today" || initialMode === "thisYear" || initialMode === "range") return initialMode as Mode;
    if (initialToday) return "today";
    if (initialStart && initialEnd) return "range";
    return "thisYear";
  };

  const [mode, setMode] = useState<Mode>(computeInitialMode());
  const [start, setStart] = useState<string>(initialStart ?? "");
  const [end, setEnd] = useState<string>(initialEnd ?? "");

  useEffect(() => {
    setStart(initialStart ?? "");
    setEnd(initialEnd ?? "");
    setMode(computeInitialMode());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStart, initialEnd, initialMode, initialToday]);

  const showInvalidDateFlash = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:flash", { detail: { type: "invalidDate" } }));
    } catch {
      // ignore
    }
  }, []);

  function handleStartChange(value: string) {
    setStart(value);
  }

  function handleEndChange(value: string) {
    setEnd(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (mode === "range" && start && end && start > end) {
      e.preventDefault();
      showInvalidDateFlash();
    }
  }

  return (
    <form method="get" action={actionPath} onSubmit={handleSubmit} className="w-full flex flex-col gap-2 mb-2">
      <div className="flex items-center gap-2 w-full">
        <select
          name="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="rounded border p-1 text-sm h-10"
        >
          <option value="thisYear">今年</option>
          <option value="today">当日</option>
          <option value="range">期間指定</option>
        </select>

        {mode === "range" && (
          <>
            <input
              name="start"
              type="date"
              aria-label="開始日"
              value={start}
              onChange={(e) => handleStartChange(e.target.value)}
              className="rounded border p-1 text-sm h-10"
            />

            <span className="text-sm text-emerald-800">～</span>

            <input
              name="end"
              type="date"
              aria-label="終了日"
              value={end}
              onChange={(e) => handleEndChange(e.target.value)}
              className="rounded border p-1 text-sm h-10"
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm text-white h-10 flex items-center justify-center">
          絞込
        </button>
      </div>

      {/* CSV button slot kept empty here; pages place CSV button under the table (right-aligned) */}
    </form>
  );
}

