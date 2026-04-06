"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  initialStart?: string | null;
  initialEnd?: string | null;
  initialToday?: boolean;
  initialThisYear?: boolean;
  actionPath?: string;
};

export default function DateRangeFilter({ initialStart, initialEnd, initialToday, initialThisYear, actionPath }: Props) {
  const [start, setStart] = useState<string>(initialStart ?? "");
  const [end, setEnd] = useState<string>(initialEnd ?? "");
  const [todayChecked, setTodayChecked] = useState<boolean>(!!initialToday);
  const [thisYearChecked, setThisYearChecked] = useState<boolean>(!!initialThisYear);

  useEffect(() => {
    if (todayChecked) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;
      setStart(todayStr);
      setEnd(todayStr);
      // when today is selected, ensure thisYear is unset
      setThisYearChecked(false);
    }
  }, [todayChecked]);

  useEffect(() => {
    if (thisYearChecked) {
      const today = new Date();
      const y = today.getFullYear();
      const startStr = `${y}-01-01`;
      const endStr = `${y}-12-31`;
      setStart(startStr);
      setEnd(endStr);
      // when thisYear is selected, ensure today is unset
      setTodayChecked(false);
    }
  }, [thisYearChecked]);

  useEffect(() => {
    // initialize from server props when component mounts
    setStart(initialStart ?? "");
    setEnd(initialEnd ?? "");
    setTodayChecked(!!initialToday);
    setThisYearChecked(!!initialThisYear);
  }, [initialStart, initialEnd, initialToday, initialThisYear]);

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
    if (thisYearChecked) {
      setThisYearChecked(false);
    }
    setStart(value);
  }

  function handleEndChange(value: string) {
    if (todayChecked) {
      setTodayChecked(false);
    }
    if (thisYearChecked) {
      setThisYearChecked(false);
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
      </div>

      <div className="flex items-center justify-start gap-3 w-full">
        <label className="flex items-center gap-2 text-sm text-emerald-800">
          <input
            name="today"
            type="checkbox"
            checked={todayChecked}
            onChange={(e) => {
              const v = e.target.checked;
              setTodayChecked(v);
              if (v) setThisYearChecked(false);
            }}
            className="h-4 w-4"
          />
          <span>当日</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-emerald-800">
          <input
            name="thisYear"
            type="checkbox"
            checked={thisYearChecked}
            onChange={(e) => {
              const v = e.target.checked;
              setThisYearChecked(v);
              if (v) setTodayChecked(false);
            }}
            className="h-4 w-4"
          />
          <span>今年</span>
        </label>

        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-sm text-white h-10 flex items-center justify-center">
          絞込
        </button>
      </div>

      {/* CSV button slot kept empty here; pages place CSV button on the right */}
    </form>
  );
}
