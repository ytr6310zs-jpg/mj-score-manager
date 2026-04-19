"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { addTournamentAction, type TournamentActionState } from "@/app/tournament-actions";
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
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 flex gap-2">
      <Input name="name" placeholder="新しい大会名" />
      <Button type="submit">{isPending ? "追加中..." : "追加"}</Button>
      {!state.success && state.message ? <p className="self-center text-xs text-destructive">{state.message}</p> : null}
    </form>
  );
}