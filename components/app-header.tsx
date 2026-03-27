import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";

type AppHeaderProps = {
  current: "input" | "matches" | "stats" | "admin";
};

export function AppHeader({ current }: AppHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Link
          href="/"
          className={buttonVariants({
            variant: current === "input" ? "default" : "outline",
            size: "sm",
            className: "w-full sm:w-auto",
          })}
        >
          スコア入力
        </Link>
        <Link
          href="/matches"
          className={buttonVariants({
            variant: current === "matches" ? "default" : "outline",
            size: "sm",
            className: "w-full sm:w-auto",
          })}
        >
          対局履歴
        </Link>
        <Link
          href="/stats"
          className={buttonVariants({
            variant: current === "stats" ? "default" : "outline",
            size: "sm",
            className: "col-span-2 w-full sm:col-span-1 sm:w-auto",
          })}
        >
          成績集計
        </Link>
        <Link
          href="/admin"
          className={buttonVariants({
            variant: current === "admin" ? "default" : "outline",
            size: "sm",
            className: "w-full sm:w-auto",
          })}
        >
          管理
        </Link>
      </div>
      <form action={logoutAction} className="w-full sm:w-auto">
        <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
          ログアウト
        </Button>
      </form>
    </div>
  );
}