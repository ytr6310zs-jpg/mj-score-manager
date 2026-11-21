"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { addTournamentAction, type TournamentActionState } from "@/app/tournament-actions";
import { ActionFeedback } from "@/components/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: TournamentActionState = { success: false, message: "" };

export function TournamentAddForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(addTournamentAction, initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-center gap-2">
      <Input name="name" aria-label="新しい大会名" placeholder="新しい大会名" />
      <Button type="submit" disabled={isPending}>
        {isPending ? "追加中..." : "追加"}
      </Button>
      <ActionFeedback success={state.success} message={state.message} className="self-center" />
    </form>
  );
}
