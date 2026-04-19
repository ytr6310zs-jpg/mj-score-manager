
"use client";
// PDF出力ボタン（画面のフィルタ状態を引き継いで印刷ページへ遷移）
import { buildStatsPrintPath } from "@/app/stats/print/query";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

type Props = { className?: string; children?: React.ReactNode };

export default function PdfExportButton({ className, children }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  function handleClick() {
    // クエリをそのまま引き継いで /stats/print へ遷移
    const query = params.toString();
    router.push(buildStatsPrintPath(query));
  }
  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "PDF出力"}
    </button>
  );
}
