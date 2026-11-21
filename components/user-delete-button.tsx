"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { deleteUserAction, type UserActionState } from "@/app/user-actions";
import { useAdminFeedback } from "@/components/admin-feedback-region";
import { ConfirmDeleteControl } from "@/components/confirm-delete-control";

const initialState: UserActionState = { success: false, message: "" };

type Props = {
  id: number;
};

export function UserDeleteButton({ id }: Props) {
  const router = useRouter();
  const { setFeedback } = useAdminFeedback();
  const [state, formAction] = useActionState(deleteUserAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!state.success || !state.message) return;
    setFeedback({ success: true, message: state.message });
    router.refresh();
  }, [state.success, state.message, setFeedback, router]);

  function handleConfirm() {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <ConfirmDeleteControl
      confirmMessage="このユーザーを削除しますか？"
      pending={isPending}
      onConfirm={handleConfirm}
      errorMessage={!state.success && state.message ? state.message : undefined}
    />
  );
}
