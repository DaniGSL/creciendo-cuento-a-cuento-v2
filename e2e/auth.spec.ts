/**
 * auth.spec.ts — Login / logout user flows.
 * These tests intentionally do NOT use stored auth state so they exercise
 * the real login form from an unauthenticated starting point.
 */

import { test, expect } from "@playwright/test";

const VALID_CODE = process.env.TEST_ACCESS_CODE ?? process.env.ADMIN_SECRET_CODE ?? "LUNA-SOL-NUBE-9743";

// ─── Unauthenticated redirects ────────────────────────────────────────────────

test("unauthenticated user visiting / is redirected to /acceso", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/acceso/);
});

test("unauthenticated user visiting /biblioteca is redirected to /acceso", async ({ page }) => {
  await page.goto("/biblioteca");
  await expect(page).toHaveURL(/\/acceso/);
});

test("unauthenticated user visiting /perfil is redirected to /acceso", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/acceso/);
});

// ─── Login form ───────────────────────────────────────────────────────────────

test("login page renders the access code form", async ({ page }) => {
  await page.goto("/acceso");
  await expect(page.getByRole("heading", { name: /código de acceso/i })).toBeVisible();
  await expect(page.getByPlaceholder(/LUNA-GATO-AZUL/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /acceder/i })).toBeVisible();
});

test("submit button is disabled until enough characters are typed", async ({ page }) => {
  await page.goto("/acceso");
  const btn = page.getByRole("button", { name: /acceder/i });
  await expect(btn).toBeDisabled();

  // Type a partial code — still disabled
  await page.getByPlaceholder(/LUNA-GATO-AZUL/i).fill("LUNA");
  await expect(btn).toBeDisabled();
});

test("invalid code shows an error message", async ({ page }) => {
  await page.goto("/acceso");
  await page.getByPlaceholder(/LUNA-GATO-AZUL/i).fill("XXXX-YYYY-ZZZZ-0000");
  await page.getByRole("button", { name: /acceder/i }).click();
  await expect(page.getByText(/no válido|desactivado|incorrecto/i)).toBeVisible({
    timeout: 8000,
  });
});

test("valid code logs in and redirects to home", async ({ page }) => {
  await page.goto("/acceso");
  await page.getByPlaceholder(/LUNA-GATO-AZUL/i).fill(VALID_CODE);
  await page.getByRole("button", { name: /acceder/i }).click();

  // Should end up on the home page (not /acceso)
  await expect(page).not.toHaveURL(/\/acceso/, { timeout: 8000 });
  await expect(page).toHaveURL("http://localhost:3000/");
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test("logout clears session and redirects to /acceso", async ({ page }) => {
  // Log in first
  await page.goto("/acceso");
  await page.getByPlaceholder(/LUNA-GATO-AZUL/i).fill(VALID_CODE);
  await page.getByRole("button", { name: /acceder/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/", { timeout: 8000 });

  // Navigate to profile and click logout
  await page.goto("/perfil");
  await page.getByRole("button", { name: /cerrar sesión/i }).click();

  await expect(page).toHaveURL(/\/acceso/, { timeout: 8000 });
});
