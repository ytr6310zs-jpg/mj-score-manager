import { ScoreForm } from "@/components/score-form";
import { AppHeader } from "@/components/app-header";
import { fetchPlayerNames } from "@/lib/players-sheet";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const players = await fetchPlayerNames();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start justify-center px-4 py-6 sm:py-8 md:items-center md:py-10">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/70">
            Mahjong Score Manager
          </p>
          <AppHeader current="input" />
        </div>
        <ScoreForm players={players} />
      </div>
    </main>
  );
}
