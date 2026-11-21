"use client";

import { useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { addPlayerAction, type AddPlayerState } from "@/app/player-actions";
import { ActionFeedback } from "@/components/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AddPlayerState = { success: false, message: "" };

export function PlayerAddForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(addPlayerAction, initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    startTransition(() => {
      formAction(fd);
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
      <Input name="name" aria-label="新しいプレイヤー名" placeholder="新しいプレイヤー名" />
      <Button type="submit" disabled={isPending}>
        {isPending ? "追加中..." : "追加"}
      </Button>
      <ActionFeedback success={state.success} message={state.message} className="self-center" />
    </form>
  );
}
