"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  deleted: "対局を削除しました。",
  updated: "対局を編集しました。",
  invalidDate: "日付範囲が不正だったため、該当フィールドをクリアしました。",
  yakumanDeleted: "役満を削除しました。",
};

const AUTO_DISMISS_MS = 5000;

export function FlashMessage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = searchParams.get("flash");
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((type: string) => {
    const message = MESSAGES[type] ?? null;
    if (!message) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setDisplayMessage(message);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    if (!flash) return;
    showFlash(flash);

    const url = new URL(window.location.href);
    url.searchParams.delete("flash");
    router.replace(url.pathname + (url.search !== "?" ? url.search : ""), { scroll: false });

    return undefined;
  }, [flash, router, showFlash]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      if (!customEvent.detail?.type) return;
      showFlash(customEvent.detail.type);
    };

    window.addEventListener("app:flash", handler);
    return () => window.removeEventListener("app:flash", handler);
  }, [showFlash]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!visible || !displayMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-5 py-3 shadow-lg">
        <span className="text-emerald-600">✓</span>
        <p className="text-sm font-medium text-emerald-900">{displayMessage}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-2 text-emerald-500 hover:text-emerald-800"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
