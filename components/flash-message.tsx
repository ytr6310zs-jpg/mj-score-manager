"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  deleted: "対局を削除しました。",
  updated: "対局を編集しました。",
};

const AUTO_DISMISS_MS = 5000;

export function FlashMessage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = searchParams.get("flash");
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const message = MESSAGES[flash] ?? null;
    if (!message) return;

    // メッセージを state に保持してから URL を綺麗にする
    setDisplayMessage(message);
    setVisible(true);

    const url = new URL(window.location.href);
    url.searchParams.delete("flash");
    router.replace(url.pathname + (url.search !== "?" ? url.search : ""), { scroll: false });

    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [flash, router]);

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
