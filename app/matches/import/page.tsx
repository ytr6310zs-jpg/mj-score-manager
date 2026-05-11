import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { MatchImportForm } from "@/components/match-import-form";
import { buttonVariants } from "@/components/ui/button";
import { canUseScoreInput } from "@/lib/authorization";
import { getCurrentSession } from "@/lib/session";
import { fetchTournamentOptions } from "@/lib/tournaments";

export const metadata: Metadata = {
  title: "対局インポート | 麻雀成績入力",
  description: "Google スプレッドシートから対局データをプレビュー付きで一括インポートします",
};

export const dynamic = "force-dynamic";

export default async function MatchImportPage() {
  const session = await getCurrentSession();
  if (!session || !canUseScoreInput(session.role)) {
    redirect("/matches");
  }

  const tournaments = await fetchTournamentOptions();

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="matches" sessionUser={{ displayName: session.displayName, role: session.role }} />

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-900">対局インポート</h1>
          <Link href="/matches" className={buttonVariants({ variant: "outline", size: "sm" })}>
            対局履歴に戻る
          </Link>
        </div>

        <MatchImportForm tournaments={tournaments} />
      </div>
    </main>
  );
}
