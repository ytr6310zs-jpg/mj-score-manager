import { verifySync } from "otplib";

const OTP_DIGITS = 6;

export function normalizeOtpCode(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

export function verifyTotpCode(code: string, secret: string): boolean {
  const normalizedCode = normalizeOtpCode(code);
  if (normalizedCode.length !== OTP_DIGITS) {
    return false;
  }

  // Google Authenticator互換で30秒ごとに更新、前後1ステップの時刻ズレを許容。
  const result = verifySync({
    strategy: "totp",
    token: normalizedCode,
    secret,
    period: 30,
    epochTolerance: [30, 30],
    digits: 6,
  });

  return result.valid;
}