import Link from "next/link";

import { ScoreForm } from "@/components/score-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/app/login/actions";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/70">
            Mahjong Score Manager
          </p>
          <div className="flex items-center gap-2">
            <Link href="/stats" className={buttonVariants({ variant: "outline", size: "sm" })}>
              成績集計
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
        <ScoreForm />
      </div>
    </main>
  );
}
