"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { addYakumanTypeAction, type YakumanTypeActionState } from "@/app/yakuman-types-actions";
import { ActionFeedback } from "@/components/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: YakumanTypeActionState = { success: false, message: "" };

export function YakumanAddForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(addYakumanTypeAction, initialState);
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
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 flex max-w-lg flex-col gap-2">
      <div className="flex gap-2">
        <Input name="code" aria-label="コード" placeholder="コード (例: DA)" />
        <Input name="name" aria-label="役名" placeholder="役名 (例: 大三元)" />
      </div>
      <div className="flex gap-2">
        <Input name="points" aria-label="点数" placeholder="点数 (例: 32000)" />
        <Input name="sort_order" aria-label="表示順" placeholder="表示順 (数値)" />
      </div>
      <Input name="description" aria-label="説明" placeholder="説明 (任意)" />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "追加中..." : "追加"}
        </Button>
        <ActionFeedback success={state.success} message={state.message} />
      </div>
    </form>
  );
}
