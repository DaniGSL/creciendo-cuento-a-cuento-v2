import { describe, it, expect } from "vitest";
import { generateCode, generateCodes, WORDS } from "@/lib/admin/wordlist";

const CODE_RE = /^[A-Z]+-[A-Z]+-[A-Z]+-\d{4}$/;

// ─── generateCode ─────────────────────────────────────────────────────────────

describe("generateCode", () => {
  it("matches PALABRA-PALABRA-PALABRA-NNNN format", () => {
    // Run many times to cover random variation
    for (let i = 0; i < 50; i++) {
      expect(generateCode(), `iteration ${i}`).toMatch(CODE_RE);
    }
  });

  it("uses words exclusively from the wordlist", () => {
    for (let i = 0; i < 20; i++) {
      const words = generateCode().split("-").slice(0, 3);
      for (const w of words) {
        expect(WORDS, `"${w}" not in wordlist`).toContain(w);
      }
    }
  });

  it("4-digit suffix is in range 1000–9999", () => {
    for (let i = 0; i < 30; i++) {
      const n = Number(generateCode().split("-")[3]);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });

  it("uses 3 distinct words (no repeats)", () => {
    for (let i = 0; i < 50; i++) {
      const words = generateCode().split("-").slice(0, 3);
      expect(new Set(words).size, `duplicate word found in: ${words}`).toBe(3);
    }
  });

  it("has exactly 4 dash-separated segments", () => {
    expect(generateCode().split("-")).toHaveLength(4);
  });
});

// ─── generateCodes ────────────────────────────────────────────────────────────

describe("generateCodes", () => {
  it("returns exactly the requested count", () => {
    expect(generateCodes(1)).toHaveLength(1);
    expect(generateCodes(5)).toHaveLength(5);
    expect(generateCodes(20)).toHaveLength(20);
    expect(generateCodes(50)).toHaveLength(50);
  });

  it("all codes in a batch are unique", () => {
    const codes = generateCodes(50);
    expect(new Set(codes).size).toBe(50);
  });

  it("all codes match the format", () => {
    generateCodes(20).forEach((c) => expect(c).toMatch(CODE_RE));
  });

  it("returns an empty array for count=0", () => {
    expect(generateCodes(0)).toHaveLength(0);
  });
});

// ─── WORDS wordlist ───────────────────────────────────────────────────────────

describe("WORDS wordlist", () => {
  it("has at least 30 words (enough variety)", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(30);
  });

  it("all words are uppercase and contain only A-Z", () => {
    for (const w of WORDS) {
      expect(w, `"${w}" has invalid chars`).toMatch(/^[A-Z]+$/);
    }
  });

  it("all words are unique", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
  });
});
