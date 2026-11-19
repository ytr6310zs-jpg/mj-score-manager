import { defineConfig, devices } from "@playwright/test";
import { createRequire } from "node:module";

// @next/env は ESM named export を持たないため CJS の require 経由でロード
const _require = createRequire(import.meta.url);
const { loadEnvConfig } = _require("@next/env") as {
  loadEnvConfig: (dir: string) => void;
};
loadEnvConfig(process.cwd());

/**
 * Playwright configuration for browser-based E2E tests
 *
 * Runs against local dev server and local Supabase for realistic end-to-end flows.
 */
export default defineConfig({
  testDir: "./test/e2e/ui",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices.chromium },
    },
  ],

  // Use `next start` (production) rather than `next dev`.
  // Under `next dev`, Playwright CDP clicks on the account menu do not invoke React
  // onClick (aria-expanded stays false); the same test passes on `next start`.
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

