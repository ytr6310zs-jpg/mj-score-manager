import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminIndexPage() {
  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="admin" />

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
                <li>
                  <Link href="/admin/yakumans" className="text-primary underline">
                    役満種別管理
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
