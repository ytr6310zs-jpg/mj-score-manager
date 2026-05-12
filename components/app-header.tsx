"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { readSharedFilterState, buildSharedFilterSearchParams, type SharedFilterState } from "@/lib/filter-state-preference";

import { logoutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { RoleCode } from "@/lib/auth";

type NavTarget = "input" | "matches" | "stats" | "compatibility" | "admin";

const USER_MANUAL_URL = "https://ytr6310zs-jpg.github.io/mj-score-manager/user-manual.html";

type AppHeaderProps = {
  current: NavTarget;
  sessionUser?: {
    displayName: string;
    role: RoleCode;
  };
};

export function AppHeader({ current, sessionUser }: AppHeaderProps) {
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<null | NavTarget>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const canUseScoreInput = sessionUser?.role !== "viewer";
  const canAccessAdmin = sessionUser?.role === "admin";
  const [matchesHref, setMatchesHref] = useState<string | null>(null);
  const [statsHref, setStatsHref] = useState<string | null>(null);
  const [compatibilityHref, setCompatibilityHref] = useState<string | null>(null);

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
    try {
      const stored = readSharedFilterState();
      if (stored) {
        const mParams = buildSharedFilterSearchParams(stored, { includeMinGames: false });
        setMatchesHref(`/matches?${mParams.toString()}`);
        const sParams = buildSharedFilterSearchParams(stored, { includeMinGames: true });
        setStatsHref(`/stats?${sParams.toString()}`);
        const cParams = buildSharedFilterSearchParams(stored, { includeMinGames: true });
        setCompatibilityHref(`/compatibility?${cParams.toString()}`);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function updateFromStored(detail?: SharedFilterState | null) {
      try {
        const stored = detail ?? readSharedFilterState();
        if (!stored) {
          setMatchesHref(null);
          setStatsHref(null);
          setCompatibilityHref(null);
          return;
        }
        const mParams = buildSharedFilterSearchParams(stored, { includeMinGames: false });
        setMatchesHref(`/matches?${mParams.toString()}`);
        const sParams = buildSharedFilterSearchParams(stored, { includeMinGames: true });
        setStatsHref(`/stats?${sParams.toString()}`);
        const cParams = buildSharedFilterSearchParams(stored, { includeMinGames: true });
        setCompatibilityHref(`/compatibility?${cParams.toString()}`);
      } catch {
        // ignore
      }
    }

    const onCustom = (e: Event) => {
      const ce = e as CustomEvent;
      updateFromStored(ce.detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === undefined) {
        // ignore
      }
      if (e.key === "mj-score-manager:shared-filter") {
        try {
          const detail = e.newValue ? JSON.parse(e.newValue) : null;
          updateFromStored(detail);
        } catch {
          updateFromStored(null);
        }
      }
    };

    window.addEventListener("mj:shared-filter-changed", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("mj:shared-filter-changed", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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

  function handleNavClick(target: Exclude<NavTarget, "admin">) {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (current === target || navigatingTo) {
        e.preventDefault();
        return;
      }
      setNavigatingTo(target);
    };
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/70 sm:text-sm">
          Mahjong Score Manager
        </p>
        <Menu pathname={pathname} current={current} setNavigatingTo={setNavigatingTo} navigatingTo={navigatingTo} canAccessAdmin={canAccessAdmin} sessionUser={sessionUser} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {canUseScoreInput ? (
          <Link href="/" className={navClass("input")} onClick={handleNavClick("input")} aria-busy={navigatingTo === "input"} aria-disabled={navigatingTo === "input"}>
            スコア入力
          </Link>
        ) : null}
        <Link href={matchesHref ?? "/matches"} className={navClass("matches")} onClick={handleNavClick("matches")} aria-busy={navigatingTo === "matches"} aria-disabled={navigatingTo === "matches"}>
          対局履歴
        </Link>
        <Link href={statsHref ?? "/stats"} className={navClass("stats")} onClick={handleNavClick("stats")} aria-busy={navigatingTo === "stats"} aria-disabled={navigatingTo === "stats"}>
          成績集計
        </Link>
        <Link href={compatibilityHref ?? "/compatibility"} className={navClass("compatibility")} onClick={handleNavClick("compatibility")} aria-busy={navigatingTo === "compatibility"} aria-disabled={navigatingTo === "compatibility"}>
          相性表
        </Link>

        {showIndicator && (
          <div
            role="status"
            aria-live="polite"
            aria-label="画面遷移中"
            className="ml-2 inline-flex h-7 w-7 items-center justify-center"
          >
            <span
              className="inline-flex h-6 w-6 origin-center animate-spin items-center justify-center text-[18px] leading-none"
              aria-hidden
            >
              🀄
            </span>
          </div>
        )}

        <div className="sr-only" aria-live="polite">
          {navigatingTo ? "画面を読み込み中" : null}
        </div>
      </div>
    </div>
  );
}

function Menu({
  pathname,
  current,
  setNavigatingTo,
  navigatingTo,
  canAccessAdmin,
  sessionUser,
}: {
  pathname: string | null;
  current: NavTarget;
  setNavigatingTo: Dispatch<SetStateAction<null | NavTarget>>;
  navigatingTo: null | NavTarget;
  canAccessAdmin: boolean;
  sessionUser?: {
    displayName: string;
    role: RoleCode;
  };
}) {
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
          {sessionUser ? (
            <div className="mb-2 border-b pb-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{sessionUser.displayName}</p>
              <p>権限: {sessionUser.role}</p>
            </div>
          ) : null}
          {canAccessAdmin ? (
            <Link
              href="/admin"
              className={buttonVariants({
                variant: current === "admin" ? "default" : "ghost",
                size: "sm",
                className: "w-full text-left",
              })}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if ((current === "admin" && pathname === "/admin") || navigatingTo) {
                  e.preventDefault();
                  return;
                }
                setIsOpen(false);
                setNavigatingTo("admin");
              }}
              role="menuitem"
            >
              管理
            </Link>
          ) : null}
          <a
            href={USER_MANUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "mt-1 w-full justify-start text-left",
            })}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            マニュアル
          </a>
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
