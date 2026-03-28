/**
 * app.spec.ts — Smoke tests for the main authenticated app pages.
 * Uses the stored user auth state created by auth.setup.ts.
 */

import { test, expect } from "@playwright/test";

// Load user cookies saved by the setup step
test.use({ storageState: "e2e/.auth/user.json" });

// ─── Home ─────────────────────────────────────────────────────────────────────

test("home page renders the hero section", async ({ page }) => {
  await page.goto("/");
  // Level-1 heading is the unique h1 hero title
  await expect(page.getByRole("heading", { name: /bienvenido/i, level: 1 })).toBeVisible();
  // Two CTAs
  await expect(page.getByRole("link", { name: /crear cuento/i }).first()).toBeVisible();
  await expect(page.locator("a[href='/biblioteca']").first()).toBeVisible();
});

// ─── Biblioteca ───────────────────────────────────────────────────────────────

test("biblioteca page renders without crashing", async ({ page }) => {
  await page.goto("/biblioteca");
  await expect(page.getByRole("heading", { name: /biblioteca de cuentos/i })).toBeVisible();
  // "Todos" filter chip always present
  await expect(page.getByRole("button", { name: /todos/i })).toBeVisible();
});

test("biblioteca shows empty state or story cards", async ({ page }) => {
  await page.goto("/biblioteca");
  // Either empty state heading OR at least one link to a story
  const emptyState = page.getByText(/aún no hay cuentos/i);
  const createCard  = page.getByText(/crear nueva historia/i);
  const anyCard     = page.locator("a[href^='/cuento/']");

  await expect(emptyState.or(createCard).or(anyCard).first()).toBeVisible({ timeout: 6000 });
});

// ─── Generar ──────────────────────────────────────────────────────────────────

test("generar page renders the story form", async ({ page }) => {
  await page.goto("/generar");
  // The step progress indicator is unique ("PASO 1 DE 3")
  await expect(page.getByText(/PASO 1 DE 3/i)).toBeVisible();
});

// ─── Personajes ───────────────────────────────────────────────────────────────

test("personajes page renders the header and add button", async ({ page }) => {
  await page.goto("/personajes");
  await expect(page.getByRole("heading", { name: /mis personajes/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /añadir personaje/i })).toBeVisible();
});

test("add character form opens when button is clicked", async ({ page }) => {
  await page.goto("/personajes");
  await page.getByRole("button", { name: /añadir personaje/i }).click();
  await expect(page.getByPlaceholder(/nombre del personaje/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /guardar/i })).toBeVisible();
});

test("add character form can be cancelled", async ({ page }) => {
  await page.goto("/personajes");
  await page.getByRole("button", { name: /añadir personaje/i }).click();
  await expect(page.getByPlaceholder(/nombre del personaje/i)).toBeVisible();

  await page.getByRole("button", { name: /cancelar/i }).click();
  await expect(page.getByPlaceholder(/nombre del personaje/i)).not.toBeVisible();
});

// ─── Perfil ───────────────────────────────────────────────────────────────────

test("perfil page renders stat cards", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page.getByText(/cuentos creados/i)).toBeVisible({ timeout: 6000 });
  // Scope to <main> to avoid matching the "Personajes" nav link
  await expect(page.locator("main").getByText("Personajes")).toBeVisible();
  await expect(page.getByRole("button", { name: /cerrar sesión/i })).toBeVisible();
});

test("perfil page renders language selector", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page.getByText(/idioma de la interfaz/i)).toBeVisible({ timeout: 6000 });
  // At least one language option visible
  await expect(page.getByText(/Español/)).toBeVisible();
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test("bottom nav / desktop nav links are present on home", async ({ page }) => {
  await page.goto("/");
  // At least one nav link to /biblioteca should exist in DOM
  const libLink = page.locator("a[href='/biblioteca']").first();
  await expect(libLink).toBeVisible();
});
