import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";

export default function AdminIndexPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/70">Mahjong Score Manager</p>
          <AppHeader current="admin" />
        </div>

        <div className="max-w-3xl mx-auto py-2">
          <Card>
            <CardHeader>
              <CardTitle>管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">管理者向けの操作パネルです。</p>

              <ul className="space-y-2">
                <li>
                  <Link href="/admin/players" className="text-primary underline">
                    プレイヤー管理
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
