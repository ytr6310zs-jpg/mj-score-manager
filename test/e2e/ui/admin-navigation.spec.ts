import { expect, test } from "@playwright/test";

import { BASE_URL, gotoAndSettle, loginAndSettle } from "./helpers/auth";

test.describe("Admin navigation", () => {
  test("can return to admin menu from a sub-admin page via hamburger menu", async ({ page }) => {
    await loginAndSettle(page);

    await gotoAndSettle(page, "/admin/users", "ユーザー管理");

    await page.getByRole("button", { name: "アカウントメニュー" }).click();
    const accountPanel = page.locator("#app-header-account-panel");
    await expect(accountPanel).toBeVisible();

    const adminLink = accountPanel.getByRole("link", { name: "管理" });
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    await expect(page.getByRole("heading", { name: "管理" })).toBeVisible();
  });
});
