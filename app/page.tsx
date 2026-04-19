import { AppHeader } from "@/components/app-header";
import { ScoreForm } from "@/components/score-form";
import { fetchPlayerNames } from "@/lib/players-sheet";
import { fetchTournamentOptions } from "@/lib/tournaments";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const players = await fetchPlayerNames();
  const tournaments = await fetchTournamentOptions();
  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="input" />
        <ScoreForm players={players} tournaments={tournaments} />
      </div>
    </main>
  );
}
