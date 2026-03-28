import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/claude/prompts";
import type { BuildUserPromptParams } from "@/lib/claude/prompts";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_PARAMS: BuildUserPromptParams = {
  characters: [
    { id: "1", name: "Luna", description: "Una niña curiosa y valiente" },
    { id: "2", name: "Max", description: "El perrito de Luna, muy leal" },
  ],
  genre: "Aventura",
  language: "español",
  readingLevel: "infantil",
  readingTime: 5,
};

// ─── buildSystemPrompt ────────────────────────────────────────────────────────

describe("buildSystemPrompt", () => {
  it("returns a non-empty string", () => {
    const prompt = buildSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("contains the content-safety guardrails", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("NUNCA");
    expect(prompt).toContain("violencia");
    expect(prompt).toContain("final feliz");
  });

  it("instructs the model on output format (title first)", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("título");
  });

  it("is idempotent — two calls return the same string", () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt());
  });
});

// ─── buildUserPrompt ─────────────────────────────────────────────────────────

describe("buildUserPrompt", () => {
  it("includes all character names", () => {
    const prompt = buildUserPrompt(BASE_PARAMS);
    expect(prompt).toContain("Luna");
    expect(prompt).toContain("Max");
  });

  it("includes character descriptions", () => {
    const prompt = buildUserPrompt(BASE_PARAMS);
    expect(prompt).toContain("curiosa y valiente");
    expect(prompt).toContain("muy leal");
  });

  it("includes the genre", () => {
    expect(buildUserPrompt(BASE_PARAMS)).toContain("Aventura");
  });

  it("includes the language", () => {
    expect(buildUserPrompt(BASE_PARAMS)).toContain("español");
  });

  it("includes the computed word count as a number", () => {
    // infantil 60 wpm × 5 min = 300 words
    const prompt = buildUserPrompt(BASE_PARAMS);
    expect(prompt).toContain("300");
  });

  it("includes reading time in minutes", () => {
    expect(buildUserPrompt(BASE_PARAMS)).toContain("5");
  });

  it("includes the level instructions", () => {
    const prompt = buildUserPrompt(BASE_PARAMS);
    // Level instructions are embedded — check for at least one marker
    expect(prompt).toContain("Infantil");
  });

  it("adds RTL note for Arabic", () => {
    const prompt = buildUserPrompt({ ...BASE_PARAMS, language: "árabe" });
    expect(prompt).toContain("derecha a izquierda");
    expect(prompt).toContain("árabe");
  });

  it("adds RTL note for Urdu", () => {
    const prompt = buildUserPrompt({ ...BASE_PARAMS, language: "urdu" });
    expect(prompt).toContain("derecha a izquierda");
  });

  it("does NOT add RTL note for LTR languages", () => {
    const ltrLanguages = ["español", "catalán", "inglés", "francés", "alemán"] as const;
    for (const language of ltrLanguages) {
      const prompt = buildUserPrompt({ ...BASE_PARAMS, language });
      expect(prompt, `${language} should not have RTL note`).not.toContain("derecha a izquierda");
    }
  });

  it("works with no characters (empty array)", () => {
    const prompt = buildUserPrompt({ ...BASE_PARAMS, characters: [] });
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(50);
  });

  it("word count scales with readingTime", () => {
    const prompt5 = buildUserPrompt({ ...BASE_PARAMS, readingTime: 5 });
    const prompt10 = buildUserPrompt({ ...BASE_PARAMS, readingTime: 10 });
    // 5 min → 300 words, 10 min → 600 words
    expect(prompt5).toContain("300");
    expect(prompt10).toContain("600");
  });

  it("word count reflects WPM of the chosen level", () => {
    const adultPrompt = buildUserPrompt({
      ...BASE_PARAMS,
      readingLevel: "adulto",
      readingTime: 10, // 200 wpm × 10 = 2000 words
    });
    expect(adultPrompt).toContain("2000");
  });
});
