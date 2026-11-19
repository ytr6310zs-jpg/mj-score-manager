import { expect, type Page } from "@playwright/test";
import { generate } from "otplib";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const E2E_LOGIN_USER_ID = process.env.E2E_LOGIN_USER_ID || "admin";
const E2E_LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD || "ChangeMe_184";
const TOTP_SECRET_RAW = String(process.env.MFA_TOTP_SECRET ?? "").trim();
const TOTP_SECRET = TOTP_SECRET_RAW && TOTP_SECRET_RAW !== "MFA_TOTP_SECRET" ? TOTP_SECRET_RAW : "";

/**
 * Log in for Playwright UI tests, then wait until the post-login page has settled.
 *
 * Landing paths (keep both until #305 merges):
 * - develop today: viewer → `/matches`, other roles → `/`
 * - #305 / PR #309: all roles → `/matches`
 *
 * Waiting only for URL and then immediately `page.goto` elsewhere can abort the
 * in-flight navigation (`net::ERR_ABORTED`) when the landing page is heavy.
 */
export async function loginAndSettle(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('input[name="userId"], input#userId').first()).toBeVisible();
  await page.fill('input[name="userId"], input#userId', E2E_LOGIN_USER_ID);
  await page.fill('input[name="password"], input#password', E2E_LOGIN_PASSWORD);

  const loginButton = page.locator('button[type="submit"], button:has-text("ログイン")').first();
  await loginButton.click();

  if (TOTP_SECRET) {
    const otpInput = page.locator('input[name="otp"], input#otp').first();
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    const code = await generate({ secret: TOTP_SECRET, digits: 6, period: 30 });
    await otpInput.fill(code);
    await loginButton.click();
  }

  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/matches", { timeout: 10000 });
  await page.waitForLoadState("domcontentloaded");

  const pathname = new URL(page.url()).pathname;
  if (pathname === "/matches") {
    await expect(page.getByRole("heading", { name: "対局履歴" })).toBeVisible({ timeout: 15000 });
  } else {
    // Score entry (`/`) — prefer the form title; fall back to any main heading.
    const scoreTitle = page.getByText("スコア入力", { exact: false }).first();
    const anyHeading = page.locator("h1, h2").first();
    await expect(scoreTitle.or(anyHeading)).toBeVisible({ timeout: 15000 });
  }
}

export async function gotoAndSettle(page: Page, path: string, headingName: string | RegExp): Promise<void> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: headingName })).toBeVisible({ timeout: 15000 });
}

export { BASE_URL };
