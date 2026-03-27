"use client";

import React, { useEffect, useState } from "react";

type Props = {
  start?: string | null;
  end?: string | null;
  today?: boolean;
  action?: string;
};

export default function DateFilter({ start, end, today, action }: Props) {
  const [s, setS] = useState(start ?? "");
  const [e, setE] = useState(end ?? "");
  const [t, setT] = useState(Boolean(today));

  useEffect(() => {
    if (t) {
      const todayStr = new Date().toISOString().slice(0, 10);
      setS(todayStr);
      setE(todayStr);
    }
  }, [t]);

  return (
    <form method="get" action={action} className="mb-4 flex flex-wrap items-end gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-emerald-800">開始日</label>
        <input name="start" type="date" value={s} onChange={(ev) => setS(ev.target.value)} className="rounded border p-1 text-sm" />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-emerald-800">終了日</label>
        <input name="end" type="date" value={e} onChange={(ev) => setE(ev.target.value)} className="rounded border p-1 text-sm" />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-emerald-800">当日</label>
        <input name="today" type="checkbox" checked={t} onChange={(ev) => setT(ev.target.checked)} className="h-4 w-4" />
      </div>

      <button type="submit" className="ml-2 rounded bg-emerald-600 px-3 py-1 text-sm text-white">絞込</button>
      <a href={action ?? "/"} className="ml-2 rounded border px-3 py-1 text-sm">クリア</a>
    </form>
  );
}
