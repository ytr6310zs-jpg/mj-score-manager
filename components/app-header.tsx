"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";

type NavTarget = "input" | "matches" | "stats" | "admin";

type AppHeaderProps = {
  current: NavTarget;
};

export function AppHeader({ current }: AppHeaderProps) {
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<null | NavTarget>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const delayTimerRef = useRef<number | null>(null);
  const timeoutTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear pending state when the pathname changes (navigation finished)
    setNavigatingTo(null);
    setShowIndicator(false);
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    if (navigatingTo) {
      // Show indicator only if navigation lasts longer than 120ms
      delayTimerRef.current = window.setTimeout(() => {
        setShowIndicator(true);
      }, 120);

      // Auto-clear after 10s to avoid stuck UI
      timeoutTimerRef.current = window.setTimeout(() => {
        setNavigatingTo(null);
        setShowIndicator(false);
      }, 10000);
    } else {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      setShowIndicator(false);
    }

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, [navigatingTo]);

  function navClass(target: Exclude<NavTarget, "admin">) {
    const base = buttonVariants({
      variant: current === target ? "default" : "outline",
      size: "sm",
      className: "w-auto",
    });
    if (navigatingTo === target) return `${base} opacity-70 cursor-wait pointer-events-none`;
    return base;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/70 sm:text-sm">
          Mahjong Score Manager
        </p>
        <Menu current={current} setNavigatingTo={setNavigatingTo} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/" className={navClass("input")} onClick={() => setNavigatingTo("input")} aria-busy={navigatingTo === "input"} aria-disabled={navigatingTo === "input"}>
          スコア入力
        </Link>
        <Link href="/matches" className={navClass("matches")} onClick={() => setNavigatingTo("matches")} aria-busy={navigatingTo === "matches"} aria-disabled={navigatingTo === "matches"}>
          対局履歴
        </Link>
        <Link href="/stats" className={navClass("stats")} onClick={() => setNavigatingTo("stats")} aria-busy={navigatingTo === "stats"} aria-disabled={navigatingTo === "stats"}>
          成績集計
        </Link>

        {showIndicator && (
          <div
            role="status"
            aria-live="polite"
            aria-label="画面遷移中"
            className="ml-2 inline-flex items-center rounded-full border bg-card px-2 py-1"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current text-primary" aria-hidden />
          </div>
        )}

        <div className="sr-only" aria-live="polite">
          {navigatingTo ? "画面を読み込み中" : null}
        </div>
      </div>
    </div>
  );
}

function Menu({ current, setNavigatingTo }: { current: NavTarget; setNavigatingTo: Dispatch<SetStateAction<null | NavTarget>> }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!isOpen) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M3 5h14a1 1 0 100-2H3a1 1 0 000 2zm14 6H3a1 1 0 100 2h14a1 1 0 100-2zm0 6H3a1 1 0 100 2h14a1 1 0 100-2z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 min-w-[8rem] rounded-md border bg-card p-2 shadow-sm" role="menu">
          <Link
            href="/admin"
            className={buttonVariants({
              variant: current === "admin" ? "default" : "ghost",
              size: "sm",
              className: "w-full text-left",
            })}
            onClick={() => {
              setIsOpen(false);
              setNavigatingTo("admin");
            }}
            role="menuitem"
          >
            管理
          </Link>
          <form action={logoutAction} className="mt-2">
            <Button type="submit" variant="ghost" size="sm" className="w-full text-left" role="menuitem">
              ログアウト
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
