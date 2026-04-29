"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { deleteUserAction, type UserActionState } from "@/app/user-actions";
import { Button } from "@/components/ui/button";

const initialState: UserActionState = { success: false, message: "" };

type Props = {
  id: number;
};

export function UserDeleteButton({ id }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteUserAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  function handleDelete() {
    if (!window.confirm("このユーザーを削除しますか？")) return;

    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
      >
        {isPending ? "削除中..." : "削除"}
      </Button>
      {!state.success && state.message ? <p className="mt-1 text-xs text-destructive">{state.message}</p> : null}
    </div>
  );
}
