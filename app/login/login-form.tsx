"use client";

import { useActionState } from "react";

import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: null as string | null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle>アクセス認証</CardTitle>
        <CardDescription>共通パスワードを入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state.error ? (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "認証中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
