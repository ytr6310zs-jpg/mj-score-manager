"use client";

import { useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { addPlayerAction, type AddPlayerState } from "@/app/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

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

  // refresh list when addition succeeded (run once on state change)
  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <Input name="name" placeholder="新しいプレイヤー名" />
      <Button type="submit">{isPending ? "追加中..." : "追加"}</Button>
    </form>
  );
}
