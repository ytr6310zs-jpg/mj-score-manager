import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              スコア入力
            </Link>
            <Link href="/matches" className={buttonVariants({ variant: "default", size: "sm" })}>
              対局履歴
            </Link>
            <Link href="/stats" className={buttonVariants({ variant: "outline", size: "sm" })}>
              成績集計
            </Link>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>対局を編集</CardTitle>
            <CardDescription>対局データを編集して更新します</CardDescription>
          </CardHeader>
          <CardContent>
            <MatchEditForm match={match} players={players} createdAt={decodedCreatedAt} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
