/**
 * admin.spec.ts — Smoke tests for the admin panel.
 * Unauthenticated redirects use no state; authenticated tests use the
 * stored admin auth state created by auth.setup.ts.
 */

import { test, expect, type Page } from "@playwright/test";

const VALID_ADMIN_CODE =
  process.env.ADMIN_SECRET_CODE ?? "LUNA-SOL-NUBE-9743";

// ─── Unauthenticated redirects ────────────────────────────────────────────────

test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("unauthenticated /admin/codigos redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin/codigos");
  await expect(page).toHaveURL(/\/admin\/login/);
});

// ─── Admin login form ─────────────────────────────────────────────────────────

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: /administrador/i })).toBeVisible();
  await expect(page.getByPlaceholder(/LUNA-SOL-NUBE/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /acceder/i })).toBeVisible();
});

test("wrong admin code shows an error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/LUNA-SOL-NUBE/i).fill("XXXX-YYYY-ZZZZ-0000");
  await page.getByRole("button", { name: /acceder/i }).click();
  await expect(page.getByText(/incorrecto|inválido|error/i)).toBeVisible({ timeout: 5000 });
});

test("correct admin code logs in and shows the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/LUNA-SOL-NUBE/i).fill(VALID_ADMIN_CODE);
  await page.getByRole("button", { name: /acceder/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 8000 });
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});

// ─── Dashboard (uses stored admin state) ─────────────────────────────────────

test.describe("authenticated admin dashboard", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("dashboard renders stat cards", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/códigos activos/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/cuentos generados/i)).toBeVisible();
  });

  test("admin header shows Dashboard and Códigos nav links", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /códigos/i })).toBeVisible();
  });
});

// ─── Codes page (uses stored admin state) ─────────────────────────────────────

test.describe("authenticated admin codes page", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("codes page renders table header and action buttons", async ({ page }) => {
    await page.goto("/admin/codigos");
    await expect(page.getByRole("heading", { name: /códigos de acceso/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /nuevo código/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /generar lote/i })).toBeVisible();
  });

  test("new code form opens when button is clicked", async ({ page }) => {
    await page.goto("/admin/codigos");
    await page.getByRole("button", { name: /nuevo código/i }).click();
    await expect(page.getByPlaceholder(/familia garcía/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /generar código/i })).toBeVisible();
  });

  test("can generate a new code and it appears in the table", async ({ page }) => {
    await page.goto("/admin/codigos");

    // Wait for table to finish loading before snapshotting the baseline count
    await page.waitForSelector("table tbody tr");
    const initialCount = await page.locator("table tbody tr").count();

    // Open form and submit
    await page.getByRole("button", { name: /nuevo código/i }).click();
    await page.getByRole("button", { name: /generar código/i }).click();

    // Wait for the table to gain a new row
    await expect(page.locator("table tbody tr")).toHaveCount(initialCount + 1, {
      timeout: 6000,
    });
  });

  test("can toggle a code between active and inactive", async ({ page }) => {
    await page.goto("/admin/codigos");

    // Wait for at least one row
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 5000 });

    // Find the first status badge and click it
    const firstBadge = page.locator("table tbody tr").first()
      .getByRole("button", { name: /activo|inactivo/i });

    const currentText = await firstBadge.textContent();
    await firstBadge.click();

    // Text should flip
    const toggled = currentText?.includes("Activo") ? /Inactivo/ : /Activo/;
    await expect(firstBadge).toHaveText(toggled, { timeout: 5000 });
  });

  test("admin logout redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
  });
});
