import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">ページが見つかりません</h1>
      <Alert>
        <AlertDescription>
          指定された URL は存在しないか、移動した可能性があります。
        </AlertDescription>
      </Alert>
      <p>
        <Link href="/matches" className={buttonVariants({ variant: "default", size: "sm" })}>
          対局履歴へ戻る
        </Link>
      </p>
    </main>
  );
}
