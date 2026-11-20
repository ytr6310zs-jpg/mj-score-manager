"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">エラーが発生しました</h1>
      <Alert className="border-destructive/40 bg-destructive/5">
        <AlertDescription>
          画面の表示中に問題が起きました。再試行するか、対局履歴へ戻ってください。
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => reset()}>
          再試行
        </Button>
        <Link href="/matches" className={buttonVariants({ variant: "outline", size: "sm" })}>
          対局履歴へ戻る
        </Link>
      </div>
    </main>
  );
}
