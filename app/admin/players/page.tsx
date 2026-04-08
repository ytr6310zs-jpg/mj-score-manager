export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { editPlayerFormAction } from "@/app/player-actions";
import { PlayerAddForm } from "@/components/player-add-form";
import { PlayerDeleteButton } from "@/components/player-delete-button";

type PlayerRow = {
  id: number;
  name: string;
  created_at: string | null;
};

async function fetchPlayers(): Promise<PlayerRow[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("players").select("id,name,created_at").order("id", { ascending: true });
  if (error) {
    console.error("fetchPlayers supabase error:", error);
  }
  if (!data) return [];

  const rows = data as Array<{ id: number; name: string; created_at: string | null }>;
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name ?? ""), created_at: r.created_at ?? null }));
}

export default async function PlayersAdminPage() {
  const players = await fetchPlayers();

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="admin" />

        <div className="max-w-3xl mx-auto space-y-6 py-2">
          <Card>
            <CardHeader>
              <CardTitle>プレイヤー管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">プレイヤーの追加・編集・削除を行います。</p>

              {/* client-side add form so we can refresh list after addition */}
              <PlayerAddForm />

              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="py-2">名前</th>
                      <th className="py-2">作成日</th>
                      <th className="py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">
                          {/* edit form holds the name input; save button is rendered in the operations column and targets this form via `form` attr */}
                          <form id={`edit-player-${p.id}`} action={editPlayerFormAction} className="flex gap-2 items-center">
                            <input name="id" type="hidden" value={String(p.id)} />
                            <Input name="name" defaultValue={p.name} />
                          </form>
                        </td>
                        <td className="py-2 text-sm text-muted-foreground">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="py-2 flex items-center gap-2">
                          {/* save button targets the edit form by id */}
                          <Button type="submit" form={`edit-player-${p.id}`} size="sm">保存</Button>
                          {/* client-side delete button */}
                          <PlayerDeleteButton id={p.id} />
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
