"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deletePlayerAction, type DeletePlayerState } from "@/app/player-actions";
import { Button } from "@/components/ui/button";

const initialState: DeletePlayerState = {
  success: false,
  message: "",
};

type Props = {
  id: number;
};

export function PlayerDeleteButton({ id }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(deletePlayerAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      // For admin UI we do not show a deletion flash; simply refresh the list.
      router.refresh();
    }
  }, [state.success, router]);

  const handleDelete = () => {
    if (!window.confirm("このプレイヤーを削除してもよろしいですか？")) return;

    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(() => {
      formAction(formData);
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
