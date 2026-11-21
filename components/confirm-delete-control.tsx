"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  confirmMessage: string;
  pending: boolean;
  onConfirm: () => void;
  errorMessage?: string;
};

export function ConfirmDeleteControl({
  confirmMessage,
  pending,
  onConfirm,
  errorMessage,
}: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirming(true)}
        >
          {pending ? "削除中..." : "削除"}
        </Button>
        {errorMessage ? <p className="mt-1 text-xs text-destructive">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex max-w-xs flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
      <p className="text-xs text-destructive">{confirmMessage}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          キャンセル
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "削除中..." : "削除する"}
        </Button>
      </div>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
