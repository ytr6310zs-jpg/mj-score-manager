"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { deleteTournamentAction, type TournamentActionState } from "@/app/tournament-actions";
import { useAdminFeedback } from "@/components/admin-feedback-region";
import { ConfirmDeleteControl } from "@/components/confirm-delete-control";

const initialState: TournamentActionState = {
  success: false,
  message: "",
};

type Props = {
  id: number;
};

export function TournamentDeleteButton({ id }: Props) {
  const router = useRouter();
  const { setFeedback } = useAdminFeedback();
  const [state, formAction] = useActionState(deleteTournamentAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!state.success || !state.message) return;
    setFeedback({ success: true, message: state.message });
    router.refresh();
  }, [state.success, state.message, setFeedback, router]);

  const handleConfirm = () => {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <ConfirmDeleteControl
      confirmMessage="この大会を削除してもよろしいですか？"
      pending={isPending}
      onConfirm={handleConfirm}
      errorMessage={!state.success && state.message ? state.message : undefined}
    />
  );
}
