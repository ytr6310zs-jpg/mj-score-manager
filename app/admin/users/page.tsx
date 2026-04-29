export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/app-header";
import { UserAddForm } from "@/components/user-add-form";
import { UserDeleteButton } from "@/components/user-delete-button";
import { UserEditForm } from "@/components/user-edit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/session";
import { fetchAdminUsers } from "@/lib/users";

export default async function UsersAdminPage() {
  const session = await getCurrentSession();
  const users = await fetchAdminUsers();

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="admin" sessionUser={session ? { displayName: session.displayName, role: session.role } : undefined} />

        <div className="mx-auto max-w-4xl space-y-6 py-2">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">ユーザーの追加・編集・削除を行います。</p>

              <UserAddForm />

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="rounded-md border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      ユーザーID: {user.userId} / 作成日: {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                      <UserEditForm id={user.id} displayName={user.displayName} role={user.role} isActive={user.isActive} />
                      <UserDeleteButton id={user.id} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
