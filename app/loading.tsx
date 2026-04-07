"use client";

export default function Loading() {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-50 w-full">
      <div className="h-1 w-full overflow-hidden">
        <div className="h-1 w-1/3 bg-emerald-500/90 animate-pulse" />
      </div>
      <div className="sr-only" aria-live="polite">
        読み込み中
      </div>
    </div>
  );
}
