"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { deleteYakumanTypeAction, type YakumanTypeActionState } from "@/app/yakuman-types-actions";
import { Button } from "@/components/ui/button";

const initialState: YakumanTypeActionState = { success: false, message: "" };

type Props = {
  id: number;
};

export function YakumanDeleteButton({ id }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteYakumanTypeAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const handleDelete = () => {
    if (!window.confirm("この役満種別を削除してもよろしいですか？")) return;
    const fd = new FormData();
    fd.append("id", String(id));
    startTransition(() => {
      formAction(fd);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {isPending ? "削除中..." : "削除"}
      </Button>
      {!state.success && state.message ? <p className="mt-1 text-xs text-destructive">{state.message}</p> : null}
    </>
  );
}
