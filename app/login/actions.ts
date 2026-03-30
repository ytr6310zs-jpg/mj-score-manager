"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  LOGIN_FAILURE_COOKIE_NAME,
  LOGIN_LOCK_COOKIE_NAME,
  LOGIN_LOCK_SECONDS,
  MAX_LOGIN_FAILURES,
  SESSION_MAX_AGE_SECONDS,
  createAuthToken,
} from "@/lib/auth";
import { verifyTotpCode } from "@/lib/mfa";

type LoginState = {
  error: string | null;
};

function lockoutMessage() {
  return "ログイン試行が多いため一時的にロックしました。5分後に再試行してください。";
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const input = String(formData.get("password") ?? "");
  const otp = String(formData.get("otp") ?? "");
  const requiredPassword = process.env.ACCESS_PASSWORD;
  const rawTotp = String(process.env.MFA_TOTP_SECRET ?? "").trim();
  const totpSecret = rawTotp === "" || rawTotp === "MFA_TOTP_SECRET" ? "" : rawTotp;
  const cookieStore = await cookies();

  const handleInvalidCredential = () => {
    const currentFailures = Number(cookieStore.get(LOGIN_FAILURE_COOKIE_NAME)?.value ?? "0");
    const nextFailures = Number.isFinite(currentFailures) ? currentFailures + 1 : 1;

    cookieStore.set(LOGIN_FAILURE_COOKIE_NAME, String(nextFailures), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    if (nextFailures >= MAX_LOGIN_FAILURES) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      cookieStore.set(LOGIN_LOCK_COOKIE_NAME, String(nowSeconds + LOGIN_LOCK_SECONDS), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: LOGIN_LOCK_SECONDS,
      });
      cookieStore.delete(LOGIN_FAILURE_COOKIE_NAME);

      return { error: lockoutMessage() } satisfies LoginState;
    }

    return null;
  };

  if (!requiredPassword) {
    return { error: "サーバー側のパスワード設定が未完了です。" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const lockUntil = Number(cookieStore.get(LOGIN_LOCK_COOKIE_NAME)?.value ?? "0");
  if (Number.isFinite(lockUntil) && lockUntil > nowSeconds) {
    const remainingMinutes = Math.max(1, Math.ceil((lockUntil - nowSeconds) / 60));
    return {
      error: `ログイン試行が多いため一時的にロック中です。${remainingMinutes}分後に再試行してください。`,
    };
  }

  if (input !== requiredPassword) {
    const lock = handleInvalidCredential();
    if (lock) {
      return lock;
    }

    return { error: "パスワードが一致しません。" };
  }

  if (totpSecret && !verifyTotpCode(otp, totpSecret)) {
    const lock = handleInvalidCredential();
    if (lock) {
      return lock;
    }

    return { error: "ワンタイムパスワードが一致しません。" };
  }

  const token = await createAuthToken(requiredPassword);

  cookieStore.delete(LOGIN_FAILURE_COOKIE_NAME);
  cookieStore.delete(LOGIN_LOCK_COOKIE_NAME);
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(LOGIN_FAILURE_COOKIE_NAME);
  cookieStore.delete(LOGIN_LOCK_COOKIE_NAME);
  redirect("/login");
}
