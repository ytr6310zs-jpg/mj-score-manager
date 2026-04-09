"use client";

import React from "react";

type Props = {
  apiPath: string;
  className?: string;
  children?: React.ReactNode;
};

export default function CsvExportButton({ apiPath, className, children }: Props) {
  function handleClick() {
    const startInput = document.querySelector<HTMLInputElement>('input[name="start"]');
    const endInput = document.querySelector<HTMLInputElement>('input[name="end"]');
    const minGamesInput =
      document.querySelector<HTMLInputElement>('input[name="minGames"]') ??
      document.querySelector<HTMLSelectElement>('select[name="minGames"]');
    const start = startInput?.value ?? "";
    const end = endInput?.value ?? "";
    const minGames = minGamesInput?.value ?? "";

    // validate range: if invalid, show flash and prevent navigation
    if (start && end && start > end) {
      try {
        window.dispatchEvent(new CustomEvent("app:flash", { detail: { type: "invalidDate" } }));
      } catch {
        // ignore
      }
      return;
    }

    const params = new URLSearchParams();
    params.set("start", start ?? "");
    params.set("end", end ?? "");
    if (minGames) {
      params.set("minGames", minGames);
    }

    const url = apiPath + "?" + params.toString();
    window.location.href = url;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children ?? "CSV 出力"}
    </button>
  );
}
