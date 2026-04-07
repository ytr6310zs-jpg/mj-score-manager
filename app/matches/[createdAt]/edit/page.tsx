import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashMessage } from "@/components/flash-message";
import { fetchMatchResults } from "@/lib/matches";
import { fetchPlayerNames } from "@/lib/players-sheet";
import { MatchEditForm } from "@/components/match-edit-form";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "対局を編集 | 麻雀成績入力",
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

  // fetch yakuman occurrences for this game from Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  let yakumans: Array<{
    id: number;
    player_id: number;
    player_name: string;
    yakuman_code: string;
    yakuman_name: string;
    points: number | null;
    created_at: string | null;
  }> = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    // resolve game id
    const { data: games } = await supabase.from("games").select("id").eq("created_at", decodedCreatedAt).limit(1);
    const gamesArr = (games as unknown) as Array<{ id: number }> | null;
    const gameId = gamesArr && gamesArr.length > 0 ? gamesArr[0].id : null;
    if (gameId) {
      const { data } = await supabase
        .from("yakuman_occurrences")
        .select("id,player_id,yakuman_code,yakuman_name,points,created_at,players(id,name)")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });
      const rows = (data as unknown) as Array<Record<string, unknown>> | null;
      if (rows && Array.isArray(rows)) {
        yakumans = rows.map((r) => {
          const row = r as unknown as {
            id?: number;
            player_id?: number;
            yakuman_code?: string;
            yakuman_name?: string;
            points?: number | null;
            created_at?: string | null;
            players?: { id?: number; name?: string };
          };
          return {
            id: Number(row.id ?? 0),
            player_id: Number(row.player_id ?? 0),
            player_name: row.players?.name ?? "",
            yakuman_code: String(row.yakuman_code ?? ""),
            yakuman_name: String(row.yakuman_name ?? ""),
            points: row.points === null || row.points === undefined ? null : Number(row.points),
            created_at: row.created_at ?? null,
          };
        });
      }
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="matches" />
        <FlashMessage />

        <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>対局を編集</CardTitle>
            <CardDescription>対局データを編集して更新します</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <MatchEditForm match={match} players={players} createdAt={decodedCreatedAt} yakumans={yakumans} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
