"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  // backward compatibility: some pages still pass initialMode
  initialMode?: "today" | "thisYear" | "range";
  // new initial filter: 'year' | 'custom' | 'YYYY-MM-DD'
  initialFilter?: string;
  initialStart?: string | null;
  initialEnd?: string | null;
  actionPath?: string;
  availableDates?: string[];
};

export default function DateRangeFilter({
  initialMode,
  initialFilter,
  initialStart,
  initialEnd,
  actionPath,
  availableDates,
}: Props) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const computeInitial = (): { filter: string; start: string; end: string } => {
    // explicit new-style initialFilter takes precedence
    if (initialFilter) {
      if (initialFilter === "year") return { filter: "year", start: yearStart, end: yearEnd };
      if (initialFilter === "custom") return { filter: "custom", start: initialStart ?? "", end: initialEnd ?? "" };
      // assume date string
      return { filter: initialFilter, start: initialFilter, end: initialFilter };
    }

    // fallback to old initialMode for backward compatibility
    if (initialMode) {
      if (initialMode === "thisYear") return { filter: "year", start: yearStart, end: yearEnd };
      if (initialMode === "today") return { filter: todayStr, start: todayStr, end: todayStr };
      if (initialMode === "range") return { filter: "custom", start: initialStart ?? todayStr, end: initialEnd ?? todayStr };
    }

    // fallback to start/end presence
    if (initialStart && initialEnd) {
      if (initialStart === initialEnd) return { filter: initialStart, start: initialStart, end: initialEnd };
      if (initialStart === yearStart && initialEnd === yearEnd) return { filter: "year", start: yearStart, end: yearEnd };
      return { filter: "custom", start: initialStart, end: initialEnd };
    }

    return { filter: "year", start: yearStart, end: yearEnd };
  };

  const initial = computeInitial();
  const [filter, setFilter] = useState<string>(initial.filter);
  const [start, setStart] = useState<string>(initial.start ?? "");
  const [end, setEnd] = useState<string>(initial.end ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    // 新ページ読込完了時に自動リセット: Propsが更新されたら即座に操作可能に
    setIsSubmitting(false);

    const init = computeInitial();
    setFilter(init.filter);
    setStart(init.start ?? "");
    setEnd(init.end ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter, initialMode, initialStart, initialEnd]);

  const showInvalidDateFlash = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:flash", { detail: { type: "invalidDate" } }));
    } catch {
      // ignore
    }
  }, []);

  function isDateString(s: string) {
    return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
  }

  async function handleFilterChange(value: string) {
    setFilter(value);
    if (value === "custom") {
      // show inputs, do not auto-submit
      const todayStrLocal = new Date().toISOString().slice(0, 10);
      setStart((prev) => (prev ? prev : todayStrLocal));
      setEnd((prev) => (prev ? prev : todayStrLocal));
      return;
    }

    if (value === "year") {
      setStart(yearStart);
      setEnd(yearEnd);
    } else if (isDateString(value)) {
      setStart(value);
      setEnd(value);
    } else {
      // unknown value -> treat as year
      setStart(yearStart);
      setEnd(yearEnd);
    }

    // Mark as submitting before auto-submit
    setIsSubmitting(true);

    // auto-submit the form for non-custom selections
    setTimeout(() => {
      try {
        formRef.current?.requestSubmit?.();
      } catch {
        formRef.current?.submit();
      }
    }, 0);
  }

  function handleStartChange(value: string) {
    setStart(value);
    // keep end in sync when empty
    if (!end) setEnd(value);
  }

  function handleEndChange(value: string) {
    setEnd(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (filter === "custom" && start && end && start > end) {
      e.preventDefault();
      showInvalidDateFlash();
    }
  }

  const hasAvailable = Array.isArray(availableDates) && availableDates.length > 0;

  return (
    <form ref={formRef} method="get" action={actionPath} onSubmit={handleSubmit} className="w-full flex flex-col gap-2 mb-2">
      <div className="flex items-center gap-2 w-full flex-wrap">
        <div className="flex items-center gap-2">
          <select
            name="filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            disabled={isSubmitting}
            className="rounded border p-1 text-sm h-10 w-36 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="year">今年</option>
            {hasAvailable && availableDates!.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="custom">任意</option>
          </select>

          {isSubmitting && (
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              <span className="text-xs text-emerald-600">読込中...</span>
            </div>
          )}
        </div>

        {filter === "custom" ? (
          <>
            <input
              name="start"
              type="date"
              aria-label="開始日"
              value={start}
              onChange={(e) => handleStartChange(e.target.value)}
              className="rounded border p-1 text-sm h-10 w-28 sm:w-auto"
            />

            <span className="text-sm text-emerald-800">～</span>

            <input
              name="end"
              type="date"
              aria-label="終了日"
              value={end}
              onChange={(e) => handleEndChange(e.target.value)}
              className="rounded border p-1 text-sm h-10 w-28 sm:w-auto"
            />

            <button
              type="submit"
              className="rounded bg-emerald-600 px-3 py-1 text-sm text-white h-10 flex items-center justify-center"
            >
              絞込
            </button>
          </>
        ) : (
          // keep hidden inputs so CSV export and server can read start/end
          <>
            <input name="start" type="hidden" value={start} />
            <input name="end" type="hidden" value={end} />
          </>
        )}
      </div>

      {/* Always include filter in query so server can recognize new-style requests */}
      <input name="filter" type="hidden" value={filter} />
    </form>
  );
}
