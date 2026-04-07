"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";

type AppHeaderProps = {
  current: "input" | "matches" | "stats" | "admin";
};

export function AppHeader({ current }: AppHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/70 sm:text-sm">
          Mahjong Score Manager
        </p>
        <Menu current={current} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/"
          className={buttonVariants({
            variant: current === "input" ? "default" : "outline",
            size: "sm",
            className: "w-auto",
          })}
        >
          スコア入力
        </Link>
        <Link
          href="/matches"
          className={buttonVariants({
            variant: current === "matches" ? "default" : "outline",
            size: "sm",
            className: "w-auto",
          })}
        >
          対局履歴
        </Link>
        <Link
          href="/stats"
          className={buttonVariants({
            variant: current === "stats" ? "default" : "outline",
            size: "sm",
            className: "w-auto",
          })}
        >
          成績集計
        </Link>
      </div>
    </div>
  );
}

function Menu({ current }: { current: "input" | "matches" | "stats" | "admin" }) {
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
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            管理画面
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
