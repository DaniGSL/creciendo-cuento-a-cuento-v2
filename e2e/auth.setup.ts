/**
 * auth.setup.ts — Playwright global auth setup.
 * Runs once before the main test projects, logs in as both user and admin,
 * and saves the resulting cookie state to disk so other tests can reuse it.
 *
 * Requires:
 *   - Dev server running at http://localhost:3000
 *   - A valid access code in the access_codes table (TEST_ACCESS_CODE env var,
 *     defaults to the value of ADMIN_SECRET_CODE)
 */

import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const USER_AUTH_FILE = "e2e/.auth/user.json";
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";

// The same code works for both in dev (it's the ADMIN_SECRET_CODE
// that was also inserted into access_codes during setup)
const TEST_CODE = process.env.TEST_ACCESS_CODE ?? process.env.ADMIN_SECRET_CODE ?? "LUNA-SOL-NUBE-9743";

setup.beforeAll(() => {
  for (const file of [USER_AUTH_FILE, ADMIN_AUTH_FILE]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
});

setup("user authentication", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: { code: TEST_CODE },
  });
  expect(res.status(), "User login should succeed").toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);

  await request.storageState({ path: USER_AUTH_FILE });
});

setup("admin authentication", async ({ request }) => {
  const res = await request.post("/api/admin/login", {
    data: { code: TEST_CODE },
  });
  expect(res.status(), "Admin login should succeed").toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);

  await request.storageState({ path: ADMIN_AUTH_FILE });
});
