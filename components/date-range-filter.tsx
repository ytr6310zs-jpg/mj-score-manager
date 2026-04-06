"use client";

import { useEffect, useState, useCallback } from "react";

type Props = {
  initialStart?: string | null;
  initialEnd?: string | null;
  initialToday?: boolean;
  actionPath?: string;
};

export default function DateRangeFilter({ initialStart, initialEnd, initialToday, actionPath }: Props) {
  const [start, setStart] = useState<string>(initialStart ?? "");
  const [end, setEnd] = useState<string>(initialEnd ?? "");
  const [todayChecked, setTodayChecked] = useState<boolean>(!!initialToday);

  useEffect(() => {
    if (todayChecked) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;
      setStart(todayStr);
      setEnd(todayStr);
    }
  }, [todayChecked]);

  useEffect(() => {
    // initialize from server props when component mounts
    setStart(initialStart ?? "");
    setEnd(initialEnd ?? "");
    setTodayChecked(!!initialToday);
  }, [initialStart, initialEnd, initialToday]);

  // helper to dispatch flash
  const showInvalidDateFlash = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:flash", { detail: { type: "invalidDate" } }));
    } catch {
      // ignore
    }
  }, []);

  // no cross-component clearing — show flash only

  function handleStartChange(value: string) {
    if (todayChecked) {
      setTodayChecked(false);
    }
    setStart(value);
  }

  function handleEndChange(value: string) {
    if (todayChecked) {
      setTodayChecked(false);
    }
    setEnd(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (start && end && start > end) {
      e.preventDefault();
      // do not clear fields; notify user to correct
      showInvalidDateFlash();
    }
  }

  return (
    <form method="get" action={actionPath} onSubmit={handleSubmit} className="w-full flex flex-col gap-2 mb-2">
      <div className="flex items-center gap-2 w-full">
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

        <label className="ml-2 flex items-center gap-2 text-sm text-emerald-800">
          <input
            name="today"
            type="checkbox"
            checked={todayChecked}
            onChange={(e) => setTodayChecked(e.target.checked)}
            className="h-4 w-4"
          />
          <span>当日</span>
        </label>
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm text-white h-10 flex items-center justify-center">
          絞込
        </button>

        <button
          type="button"
          className="rounded border px-3 py-1 text-sm h-10 flex items-center justify-center"
          onClick={() => {
            setStart("");
            setEnd("");
            setTodayChecked(false);
          }}
        >
          クリア
        </button>
      </div>

      {/* CSV button slot kept empty here; pages place CSV button on the right */}
    </form>
  );
}
