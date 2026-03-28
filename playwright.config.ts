import { defineConfig, devices } from "@playwright/test";

/**
 * Run `npx playwright install --with-deps chromium` once to install browsers.
 * Set TEST_ACCESS_CODE and ADMIN_SECRET_CODE in .env.local before running E2E tests.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — tests share auth state
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // ── Auth setup (must run first) ────────────────────────────────────
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // ── Desktop tests (depend on setup) ───────────────────────────────
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
    },

    // ── Mobile smoke tests ─────────────────────────────────────────────
    {
      name: "mobile",
      use: {
        ...devices["iPhone 14"],
      },
      dependencies: ["setup"],
      // Only run basic auth + navigation on mobile
      testMatch: /auth\.spec\.ts|app\.spec\.ts/,
    },
  ],

  // Auto-start dev server if not already running
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
