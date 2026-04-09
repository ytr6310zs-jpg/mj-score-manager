"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDefaultMinGamesForFilter,
  getLoadingIndicatorPlacement,
  shouldAutoSubmitOnMinGamesChange,
  shouldShowMinGames,
} from "@/components/date-range-filter-rules";

type Props = {
  initialMode?: "today" | "thisYear" | "range";
  initialFilter?: string;
  initialStart?: string | null;
  initialEnd?: string | null;
  actionPath?: string;
  availableDates?: string[];
  initialMinGames?: string;
  showMinGames?: boolean;
};

export default function DateRangeFilter({
  initialMode,
  initialFilter,
  initialStart,
  initialEnd,
  actionPath,
  availableDates,
  initialMinGames,
  showMinGames = true,
}: Props) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const computeInitial = (): { filter: string; start: string; end: string } => {
    if (initialFilter) {
      if (initialFilter === "year") return { filter: "year", start: yearStart, end: yearEnd };
      if (initialFilter === "custom") return { filter: "custom", start: initialStart ?? "", end: initialEnd ?? "" };
      return { filter: initialFilter, start: initialFilter, end: initialFilter };
    }

    if (initialMode) {
      if (initialMode === "thisYear") return { filter: "year", start: yearStart, end: yearEnd };
      if (initialMode === "today") return { filter: todayStr, start: todayStr, end: todayStr };
      if (initialMode === "range") return { filter: "custom", start: initialStart ?? todayStr, end: initialEnd ?? todayStr };
    }

    if (initialStart && initialEnd) {
      if (initialStart === initialEnd) return { filter: initialStart, start: initialStart, end: initialEnd };
      if (initialStart === yearStart && initialEnd === yearEnd) return { filter: "year", start: yearStart, end: yearEnd };
      return { filter: "custom", start: initialStart, end: initialEnd };
    }

    return { filter: "year", start: yearStart, end: yearEnd };
  };

  const initial = computeInitial();
  const defaultMin = getDefaultMinGamesForFilter(initial.filter);
  const [filter, setFilter] = useState<string>(initial.filter);
  const [start, setStart] = useState<string>(initial.start ?? "");
  const [end, setEnd] = useState<string>(initial.end ?? "");
  const [minGames, setMinGames] = useState<string>(initialMinGames ?? defaultMin);
  const [isDisabled, setIsDisabled] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setIsDisabled(false);
  }, []);

  useEffect(() => {
    const init = computeInitial();
    setFilter(init.filter);
    setStart(init.start ?? "");
    setEnd(init.end ?? "");
    const def = getDefaultMinGamesForFilter(init.filter);
    setMinGames(initialMinGames ?? def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter, initialMode, initialStart, initialEnd, initialMinGames]);

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
      const todayStrLocal = new Date().toISOString().slice(0, 10);
      setStart((prev) => (prev ? prev : todayStrLocal));
      setEnd((prev) => (prev ? prev : todayStrLocal));
      setMinGames("");
      return;
    }

    if (value === "year") {
      setStart(yearStart);
      setEnd(yearEnd);
    } else if (isDateString(value)) {
      setStart(value);
      setEnd(value);
      setMinGames("");
    } else {
      setStart(yearStart);
      setEnd(yearEnd);
    }

    setIsDisabled(true);

    setTimeout(() => {
      try {
        formRef.current?.requestSubmit?.();
      } catch {
        formRef.current?.submit();
      }
    }, 0);
  }

  function handleMinGamesChange(value: string) {
    setMinGames(value);
    if (shouldAutoSubmitOnMinGamesChange(filter)) {
      setIsDisabled(true);
      const params = new URLSearchParams();
      params.set("filter", filter);
      params.set("start", start);
      params.set("end", end);
      params.set("minGames", value);
      const target = actionPath ? `${actionPath}?${params.toString()}` : `?${params.toString()}`;
      window.location.href = target;
    }
  }

  function handleStartChange(value: string) {
    setStart(value);
    if (!end) setEnd(value);
  }

  function handleEndChange(value: string) {
    setEnd(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (filter === "custom" && start && end && start > end) {
      e.preventDefault();
      showInvalidDateFlash();
      return;
    }

    setIsDisabled(true);
  }

  const hasAvailable = Array.isArray(availableDates) && availableDates.length > 0;
  const indicatorPlacement = getLoadingIndicatorPlacement(filter);

  return (
    <form ref={formRef} method="get" action={actionPath} onSubmit={handleSubmit} className="mb-2 flex w-full flex-col gap-2">
      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <select
            name="filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            disabled={isDisabled}
            className="h-10 w-auto rounded border p-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="year">今年</option>
            {hasAvailable && availableDates!.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
            <option value="custom">任意</option>
          </select>

          {isDisabled && indicatorPlacement === "filterRight" ? (
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              <span className="text-xs text-emerald-600">読込中...</span>
            </div>
          ) : null}
        </div>

        {shouldShowMinGames(showMinGames, filter) ? (
          <select
            value={minGames}
            onChange={(e) => handleMinGamesChange(e.target.value)}
            disabled={isDisabled}
            className="h-10 w-auto rounded border p-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="試合数フィルタ"
          >
            <option value="">試合数：条件なし</option>
            <option value="20">試合数：20試合以上</option>
          </select>
        ) : null}

        {isDisabled && indicatorPlacement === "minGamesRight" ? (
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
            <span className="text-xs text-emerald-600">読込中...</span>
          </div>
        ) : null}

        {filter === "custom" ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
            <input
              name="start"
              type="date"
              aria-label="開始日"
              value={start}
              onChange={(e) => handleStartChange(e.target.value)}
              className="h-10 w-28 rounded border p-1 text-sm sm:w-auto"
            />

            <span className="text-sm text-emerald-800">～</span>

            <input
              name="end"
              type="date"
              aria-label="終了日"
              value={end}
              onChange={(e) => handleEndChange(e.target.value)}
              className="h-10 w-28 rounded border p-1 text-sm sm:w-auto"
            />

            <button
              type="submit"
              className="flex h-10 items-center justify-center rounded bg-emerald-600 px-3 py-1 text-sm text-white"
            >
              絞込
            </button>
            {isDisabled && indicatorPlacement === "submitButtonRight" && (
              <div className="ml-2 flex items-center gap-1">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                <span className="text-xs text-emerald-600">読込中...</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <input name="start" type="hidden" value={start} />
            <input name="end" type="hidden" value={end} />
          </>
        )}
      </div>

      <input name="filter" type="hidden" value={filter} />
      <input
        name="minGames"
        type="hidden"
        value={shouldShowMinGames(showMinGames, filter) ? minGames : ""}
      />
    </form>
  );
}
