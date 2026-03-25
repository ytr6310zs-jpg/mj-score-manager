"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteMatchAction, type DeleteMatchState } from "@/app/match-actions";
import { Button } from "@/components/ui/button";

const initialState: DeleteMatchState = {
  success: false,
  message: "",
};

type MatchDeleteButtonProps = {
  createdAt: string;
};

export function MatchDeleteButton({ createdAt }: MatchDeleteButtonProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteMatchAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      router.push("/matches?flash=deleted");
    }
  }, [state.success, router]);

  const handleDelete = () => {
    if (window.confirm("この対局を削除してもよろしいですか？")) {
      const formData = new FormData();
      formData.append("createdAt", createdAt);
      startTransition(() => {
        formAction(formData);
      });
    }
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
      {state.message && (
        <p className={`mt-1 text-xs ${state.success ? "text-emerald-700" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </>
  );
}
