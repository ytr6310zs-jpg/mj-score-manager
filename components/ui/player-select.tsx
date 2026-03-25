"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  onAddPlayer?: (name: string) => Promise<{ success: boolean; message: string }>;
};

export function PlayerSelect({
  name,
  value,
  onValueChange,
  options,
  placeholder = "選択してください",
  required,
  onAddPlayer,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const filtered = trimmedQuery
    ? options.filter((option) => option.includes(trimmedQuery))
    : options;

  // 完全一致しない入力があり、追加コールバックがある場合に追加ボタンを表示
  const canAdd =
    onAddPlayer !== undefined &&
    trimmedQuery.length > 0 &&
    !options.includes(trimmedQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  function handleToggle() {
    setOpen((prev) => {
      if (!prev) {
        setQuery("");
        setAddError(null);
      }
      return !prev;
    });
  }

  function handleSelect(option: string) {
    onValueChange(option);
    setOpen(false);
    setQuery("");
    setAddError(null);
  }

  async function handleAdd() {
    if (!onAddPlayer || !trimmedQuery) return;
    setAdding(true);
    setAddError(null);
    const result = await onAddPlayer(trimmedQuery);
    setAdding(false);
    if (result.success) {
      onValueChange(trimmedQuery);
      setOpen(false);
      setQuery("");
    } else {
      setAddError(result.message);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* フォーム送信用の hidden input */}
      <input type="hidden" name={name} value={value} required={required} />

      {/* トリガー */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !value && "text-muted-foreground"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ドロップダウン */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-white shadow-lg">
          {/* 検索入力 */}
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* 選択肢リスト */}
          <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && !canAdd ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                「{trimmedQuery}」は見つかりません
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-emerald-50",
                    option === value && "bg-emerald-100 font-semibold text-emerald-900"
                  )}
                >
                  {option}
                </li>
              ))
            )}
          </ul>

          {/* 追加ボタン */}
          {canAdd && (
            <div className="border-t border-border px-2 py-2">
              {addError && (
                <p className="mb-1.5 text-xs text-destructive">{addError}</p>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="flex w-full items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {adding ? "追加中..." : `「${trimmedQuery}」を新規追加`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
