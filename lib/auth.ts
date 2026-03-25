const encoder = new TextEncoder();

export const AUTH_COOKIE_NAME = "mj_access";
export const LOGIN_FAILURE_COOKIE_NAME = "mj_login_failures";
export const LOGIN_LOCK_COOKIE_NAME = "mj_login_locked_until";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCK_SECONDS = 60 * 5;

type SessionPayload = {
  exp: number;
  nonce: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function base64UrlDecodeToString(value: string): string {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const bytes = base64ToBytes(padded);
  return new TextDecoder().decode(bytes);
}

function secureEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

async function signPayload(payloadPart: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function randomNonce(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (v) => v.toString(16).padStart(2, "0")).join("");
}

export async function createAuthToken(password: string): Promise<string> {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    nonce: randomNonce(16),
  };

  const payloadPart = base64UrlEncodeString(JSON.stringify(payload));
  const signaturePart = await signPayload(payloadPart, password);
  return `${payloadPart}.${signaturePart}`;
}

export async function verifyAuthToken(token: string, password: string): Promise<boolean> {
  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return false;
  }

  const expectedSignature = await signPayload(payloadPart, password);
  if (!secureEqual(signaturePart, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecodeToString(payloadPart)) as SessionPayload;
    return Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}