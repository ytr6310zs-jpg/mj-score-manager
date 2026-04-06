"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { addYakumanTypeAction, type YakumanTypeActionState } from "@/app/yakuman-types-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

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
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6 max-w-lg">
      <div className="flex gap-2">
        <Input name="code" placeholder="コード (例: DA)" />
        <Input name="name" placeholder="役名 (例: 大三元)" />
      </div>
      <div className="flex gap-2">
        <Input name="points" placeholder="点数 (例: 32000)" />
        <Input name="sort_order" placeholder="表示順 (数値)" />
      </div>
      <Input name="description" placeholder="説明 (任意)" />
      <div>
        <Button type="submit">{isPending ? "追加中..." : "追加"}</Button>
      </div>
    </form>
  );
}
