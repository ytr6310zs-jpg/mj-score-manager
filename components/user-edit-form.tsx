"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { editUserAction, type UserActionState } from "@/app/user-actions";
import type { RoleCode } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: UserActionState = { success: false, message: "" };

type Props = {
  id: number;
  displayName: string;
  role: RoleCode;
  isActive: boolean;
};

export function UserEditForm({ id, displayName, role, isActive }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(editUserAction, initialState);
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
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_100px_auto] sm:items-center">
      <input type="hidden" name="id" value={String(id)} />
      <Input name="displayName" defaultValue={displayName} required />
      <select name="role" className="h-10 rounded-md border px-3 text-sm" defaultValue={role}>
        <option value="viewer">参照</option>
        <option value="editor">編集</option>
        <option value="admin">管理</option>
      </select>
      <Input name="password" type="password" placeholder="新パスワード(任意)" />
      <select name="isActive" className="h-10 rounded-md border px-3 text-sm" defaultValue={isActive ? "1" : "0"}>
        <option value="1">有効</option>
        <option value="0">無効</option>
      </select>
      <Button type="submit" size="sm" disabled={isPending}>{isPending ? "保存中..." : "保存"}</Button>
      {!state.success && state.message ? <p className="text-xs text-destructive sm:col-span-5">{state.message}</p> : null}
    </form>
  );
}
