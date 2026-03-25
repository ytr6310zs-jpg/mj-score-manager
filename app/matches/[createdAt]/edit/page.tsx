import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMatchResults } from "@/lib/matches";
import { fetchPlayerNames } from "@/lib/players-sheet";
import { MatchEditForm } from "@/components/match-edit-form";

export const metadata: Metadata = {
  title: "対局編集 | 麻雀成績入力",
  description: "対局データを編集します",
};

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ createdAt: string }>;
}

export default async function MatchEditPage({ params }: EditPageProps) {
  const { createdAt } = await params;
  const decodedCreatedAt = decodeURIComponent(createdAt);

  const { matches, error: matchError } = await fetchMatchResults();
  const players = await fetchPlayerNames();

  if (matchError) {
    return (
      <main className="mx-auto min-h-screen w-full px-4 py-10">
        <div className="mx-auto max-w-screen-2xl space-y-6">
          <p className="text-destructive">{matchError}</p>
        </div>
      </main>
    );
  }

  const match = matches.find((m) => m.createdAt === decodedCreatedAt);

  if (!match) {
    redirect("/matches");
  }

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="matches" />

        <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>対局を編集</CardTitle>
            <CardDescription>対局データを編集して更新します</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <MatchEditForm match={match} players={players} createdAt={decodedCreatedAt} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
