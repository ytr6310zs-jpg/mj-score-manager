import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, type AuthSession, verifyAuthToken } from "@/lib/auth";

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return await verifyAuthToken(token);
}
