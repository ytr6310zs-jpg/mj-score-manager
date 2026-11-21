"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import { deleteYakumanTypeAction, type YakumanTypeActionState } from "@/app/yakuman-types-actions";
import { useAdminFeedback } from "@/components/admin-feedback-region";
import { ConfirmDeleteControl } from "@/components/confirm-delete-control";

const initialState: YakumanTypeActionState = { success: false, message: "" };

type Props = {
  id: number;
};

export function YakumanDeleteButton({ id }: Props) {
  const router = useRouter();
  const { setFeedback } = useAdminFeedback();
  const [state, formAction] = useActionState(deleteYakumanTypeAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!state.success || !state.message) return;
    setFeedback({ success: true, message: state.message });
    router.refresh();
  }, [state.success, state.message, setFeedback, router]);

  const handleConfirm = () => {
    const fd = new FormData();
    fd.append("id", String(id));
    startTransition(() => {
      formAction(fd);
    });
  };

  return (
    <ConfirmDeleteControl
      confirmMessage="この役満種別を削除してもよろしいですか？"
      pending={isPending}
      onConfirm={handleConfirm}
      errorMessage={!state.success && state.message ? state.message : undefined}
    />
  );
}
