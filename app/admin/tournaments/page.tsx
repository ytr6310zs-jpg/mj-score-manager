export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/app-header";
import { TournamentAddForm } from "@/components/tournament-add-form";
import { TournamentDeleteButton } from "@/components/tournament-delete-button";
import { TournamentEditForm } from "@/components/tournament-edit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTournaments } from "@/lib/tournaments";

export default async function TournamentsAdminPage() {
  const tournaments = await fetchTournaments();

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="admin" />

        <div className="mx-auto max-w-3xl space-y-6 py-2">
          <Card>
            <CardHeader>
              <CardTitle>大会管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">大会の追加・編集・削除を行います。</p>

              <TournamentAddForm />

              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="py-2">大会名</th>
                      <th className="py-2">作成日</th>
                      <th className="py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((tournament) => (
                      <tr key={tournament.id} className="border-b">
                        <td className="py-2">
                          <TournamentEditForm id={tournament.id} initialName={tournament.name} />
                        </td>
                        <td className="py-2 text-sm text-muted-foreground">
                          {tournament.created_at ? new Date(tournament.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="py-2">
                          <TournamentDeleteButton id={tournament.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}