"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { addUserAction, type UserActionState } from "@/app/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: UserActionState = { success: false, message: "" };

export function UserAddForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(addUserAction, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 grid gap-2 sm:grid-cols-5">
      <Input name="userId" placeholder="ユーザーID" required />
      <Input name="displayName" placeholder="表示名" required />
      <select name="role" className="h-10 rounded-md border px-3 text-sm" defaultValue="viewer" required>
        <option value="viewer">参照</option>
        <option value="editor">編集</option>
        <option value="admin">管理</option>
      </select>
      <Input name="password" type="password" placeholder="初期パスワード" required />
      <Button type="submit" disabled={isPending}>{isPending ? "追加中..." : "追加"}</Button>
      {!state.success && state.message ? <p className="text-xs text-destructive sm:col-span-5">{state.message}</p> : null}
    </form>
  );
}
