import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminIndexPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
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
              <Link href="/admin/games" className="text-primary underline">
                対局管理 (未実装)
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
