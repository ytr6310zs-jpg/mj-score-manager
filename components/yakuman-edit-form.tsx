"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useTransition } from "react";

import { editYakumanTypeAction, type YakumanTypeActionState } from "@/app/yakuman-types-actions";
import { ActionFeedback } from "@/components/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YakumanDeleteButton } from "@/components/yakuman-delete-button";

const initialState: YakumanTypeActionState = { success: false, message: "" };

type Props = {
  id: number;
  name: string;
  points: number | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function YakumanEditForm({ id, name, points, description, sortOrder, isActive }: Props) {
  const router = useRouter();
  const reactId = useId();
  const formId = `edit-yakuman-${id}-${reactId}`;
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(editYakumanTypeAction, initialState);
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
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <>
      <td className="py-2">
        <form ref={formRef} id={formId} onSubmit={handleSubmit} className="flex items-center gap-2">
          <input name="id" type="hidden" value={String(id)} />
          <Input name="name" aria-label="役名" defaultValue={name} />
        </form>
      </td>
      <td className="py-2">
        <Input
          name="points"
          aria-label="点数"
          defaultValue={points === null ? "" : String(points)}
          form={formId}
        />
      </td>
      <td className="py-2">
        <Input name="description" aria-label="説明" defaultValue={description ?? ""} form={formId} />
      </td>
      <td className="py-2">
        <Input name="sort_order" aria-label="表示順" defaultValue={String(sortOrder)} form={formId} />
      </td>
      <td className="py-2">
        <select
          name="is_active"
          aria-label="状態"
          defaultValue={isActive ? "1" : "0"}
          form={formId}
          className="text-sm"
        >
          <option value="1">有効</option>
          <option value="0">無効</option>
        </select>
      </td>
      <td className="flex items-center gap-2 py-2">
        <Button type="submit" form={formId} size="sm" disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </Button>
        <YakumanDeleteButton id={id} />
        <ActionFeedback success={state.success} message={state.message} />
      </td>
    </>
  );
}
