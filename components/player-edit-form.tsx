"use client";

import { editPlayerAction, type EditPlayerState } from "@/app/player-actions";
import { ActionFeedback } from "@/components/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

const initialState: EditPlayerState = {
  success: false,
  message: "",
};

type Props = {
  id: number;
  initialName: string;
};

export function PlayerEditForm({ id, initialName }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(editPlayerAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    formData.set("id", String(id));
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={String(id)} />
      <Input name="name" aria-label="プレイヤー名" defaultValue={initialName} />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </Button>
      <ActionFeedback success={state.success} message={state.message} />
    </form>
  );
}
