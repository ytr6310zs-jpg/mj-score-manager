"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deletePlayerAction, type DeletePlayerState } from "@/app/player-actions";
import { useAdminFeedback } from "@/components/admin-feedback-region";
import { ConfirmDeleteControl } from "@/components/confirm-delete-control";

const initialState: DeletePlayerState = {
  success: false,
  message: "",
};

type Props = {
  id: number;
};

export function PlayerDeleteButton({ id }: Props) {
  const router = useRouter();
  const { setFeedback } = useAdminFeedback();
  const [state, formAction] = useActionState(deletePlayerAction, initialState);
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
      confirmMessage="このプレイヤーを削除してもよろしいですか？"
      pending={isPending}
      onConfirm={handleConfirm}
      errorMessage={!state.success && state.message ? state.message : undefined}
    />
  );
}
