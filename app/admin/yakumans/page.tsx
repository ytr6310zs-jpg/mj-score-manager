export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { editYakumanTypeFormAction } from "@/app/yakuman-types-actions";
import { YakumanAddForm } from "@/components/yakuman-add-form";
import { YakumanDeleteButton } from "@/components/yakuman-delete-button";

type YakumanRow = {
  id: number;
  code: string;
  name: string;
  points: number | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

async function fetchYakumans(): Promise<YakumanRow[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("yakuman_types").select("id,code,name,points,description,sort_order,is_active").order("sort_order", { ascending: true });
  if (error) {
    console.error("fetchYakumans supabase error:", error);
  }
  if (!data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id ?? 0),
    code: String(r.code ?? ""),
    name: String(r.name ?? ""),
    points: r.points === null || r.points === undefined ? null : Number(r.points),
    description: r.description ? String(r.description) : null,
    sort_order: Number(r.sort_order ?? 100),
    is_active: Boolean(r.is_active ?? true),
  }));
}

export default async function YakumansAdminPage() {
  const yakumans = await fetchYakumans();

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="admin" />

        <div className="max-w-3xl mx-auto space-y-6 py-2">
          <Card>
            <CardHeader>
              <CardTitle>役満種別管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">役満種別の追加・編集・無効化を行います。</p>

              <YakumanAddForm />

              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="py-2">コード</th>
                      <th className="py-2">名前</th>
                      <th className="py-2">点数</th>
                      <th className="py-2">説明</th>
                      <th className="py-2">順序</th>
                      <th className="py-2">状態</th>
                      <th className="py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yakumans.map((y) => (
                      <tr key={y.id} className="border-b">
                        <td className="py-2">{y.code}</td>
                        <td className="py-2">
                          <form id={`edit-yakuman-${y.id}`} action={editYakumanTypeFormAction} className="flex gap-2 items-center">
                            <input name="id" type="hidden" value={String(y.id)} />
                            <Input name="name" defaultValue={y.name} />
                        </form>
                        </td>
                        <td className="py-2">
                          <Input name="points" defaultValue={y.points === null ? "" : String(y.points)} form={`edit-yakuman-${y.id}`} />
                        </td>
                        <td className="py-2">
                          <Input name="description" defaultValue={y.description ?? ""} form={`edit-yakuman-${y.id}`} />
                        </td>
                        <td className="py-2">
                          <Input name="sort_order" defaultValue={String(y.sort_order ?? 100)} form={`edit-yakuman-${y.id}`} />
                        </td>
                        <td className="py-2">
                          <select name="is_active" defaultValue={y.is_active ? "1" : "0"} form={`edit-yakuman-${y.id}`} className="text-sm">
                            <option value="1">有効</option>
                            <option value="0">無効</option>
                          </select>
                        </td>
                        <td className="py-2 flex items-center gap-2">
                          <Button type="submit" form={`edit-yakuman-${y.id}`} size="sm">保存</Button>
                          <YakumanDeleteButton id={y.id} />
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
