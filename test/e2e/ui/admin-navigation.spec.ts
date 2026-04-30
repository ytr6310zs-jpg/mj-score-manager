import { expect, test, type Page } from "@playwright/test";
import { totp } from "otplib";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const E2E_LOGIN_USER_ID = process.env.E2E_LOGIN_USER_ID || "admin";
const E2E_LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD || "ChangeMe_184";
const TOTP_SECRET_RAW = String(process.env.MFA_TOTP_SECRET ?? "").trim();
const TOTP_SECRET = TOTP_SECRET_RAW && TOTP_SECRET_RAW !== "MFA_TOTP_SECRET" ? TOTP_SECRET_RAW : "";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('input[name="userId"], input#userId').first()).toBeVisible();
  await page.fill('input[name="userId"], input#userId', E2E_LOGIN_USER_ID);
  await page.fill('input[name="password"], input#password', E2E_LOGIN_PASSWORD);

  const loginButton = page.locator('button[type="submit"], button:has-text("ログイン")').first();
  await loginButton.click();

  if (TOTP_SECRET) {
    const otpInput = page.locator('input[name="otp"], input#otp').first();
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    totp.options = { digits: 6, period: 30 };
    await otpInput.fill(totp.generate(TOTP_SECRET));
    await loginButton.click();
  }

  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
}

test.describe("Admin navigation", () => {
  test("can return to admin menu from a sub-admin page via hamburger menu", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page.locator("text=ユーザー管理")).toBeVisible();

    await page.locator('button[aria-haspopup="menu"]').first().click();
    const adminMenuItem = page.getByRole("menuitem", { name: "管理" }).first();
    await expect(adminMenuItem).toBeVisible();
    await adminMenuItem.click();

    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    await expect(page.getByRole("heading", { name: "管理" })).toBeVisible();
  });
});
