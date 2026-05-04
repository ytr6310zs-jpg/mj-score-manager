export const AUTH_COOKIE_NAME = "mj_access";
export const LOGIN_FAILURE_COOKIE_NAME = "mj_login_failures";
export const LOGIN_LOCK_COOKIE_NAME = "mj_login_locked_until";
export const PREAUTH_COOKIE_NAME = "mj_preauth_user";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCK_SECONDS = 60 * 5;

import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export type RoleCode = "admin" | "editor" | "viewer";

export type AuthSession = {
  uid: number;
  userId: string;
  displayName: string;
  role: RoleCode;
};

function randomNonce(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (v) => v.toString(16).padStart(2, "0")).join("");
}

function getAuthSecret(): string | null {
  const raw = String(process.env.AUTH_SESSION_SECRET ?? process.env.ACCESS_PASSWORD ?? "").trim();
  return raw ? raw : null;
}

const encoder = new TextEncoder();

function normalizeRole(value: unknown): RoleCode | null {
  if (value === "admin" || value === "editor" || value === "viewer") {
    return value;
  }
  return null;
}

export async function createAuthToken(session: AuthSession): Promise<string> {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET または ACCESS_PASSWORD が未設定です。");
  }

  return await new SignJWT({
    uid: session.uid,
    userId: session.userId,
    displayName: session.displayName,
    role: session.role,
    ver: 2,
    nonce: randomNonce(16),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encoder.encode(secret));
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, encoder.encode(secret), {
      algorithms: ["HS256"],
    });
    const { uid, userId, displayName, role } = verified.payload;

    if (!Number.isFinite(uid)) {
      return null;
    }
    if (typeof userId !== "string" || userId.trim() === "") {
      return null;
    }
    if (typeof displayName !== "string" || displayName.trim() === "") {
      return null;
    }
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return null;
    }

    return {
      uid: Number(uid),
      userId,
      displayName,
      role: normalizedRole,
    };
  } catch {
    return null;
  }
}