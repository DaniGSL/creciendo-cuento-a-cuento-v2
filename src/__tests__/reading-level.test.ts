import { describe, it, expect } from "vitest";
import {
  countWords,
  readingTimeToWordCount,
  wordCountToReadingTime,
  getLevelInstructions,
  READING_LEVEL_CONFIG,
} from "@/lib/utils/reading-level";
import type { ReadingLevel } from "@/types/database";

const ALL_LEVELS: ReadingLevel[] = [
  "infantil",
  "primaria_baja",
  "primaria_media",
  "primaria_alta",
  "secundaria",
  "adulto",
];

// ─── countWords ───────────────────────────────────────────────────────────────

describe("countWords", () => {
  it("counts a simple sentence", () => {
    expect(countWords("hola mundo cruel")).toBe(3);
  });

  it("handles multiple consecutive spaces", () => {
    expect(countWords("  uno   dos   tres  ")).toBe(3);
  });

  it("handles newlines and tabs", () => {
    expect(countWords("uno\ndos\ttres")).toBe(3);
  });

  it("returns 0 for an empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(countWords("   \t\n  ")).toBe(0);
  });

  it("counts a realistic paragraph", () => {
    const text =
      "Había una vez una pequeña niña llamada Luna que vivía en un bosque encantado.";
    expect(countWords(text)).toBe(14);
  });
});

// ─── readingTimeToWordCount ────────────────────────────────────────────────────

describe("readingTimeToWordCount", () => {
  it("infantil 5 min → 300 words (60 wpm × 5)", () => {
    expect(readingTimeToWordCount("infantil", 5)).toBe(300);
  });

  it("adulto 10 min → 2000 words (200 wpm × 10)", () => {
    expect(readingTimeToWordCount("adulto", 10)).toBe(2000);
  });

  it("returns a positive integer for all levels", () => {
    for (const level of ALL_LEVELS) {
      const wc = readingTimeToWordCount(level, 10);
      expect(wc).toBeGreaterThan(0);
      expect(Number.isInteger(wc)).toBe(true);
    }
  });

  it("word count scales linearly with time", () => {
    expect(readingTimeToWordCount("primaria_media", 10)).toBe(
      readingTimeToWordCount("primaria_media", 5) * 2
    );
  });
});

// ─── wordCountToReadingTime ────────────────────────────────────────────────────

describe("wordCountToReadingTime", () => {
  it("roundtrips with readingTimeToWordCount", () => {
    for (const level of ALL_LEVELS) {
      for (const minutes of [5, 10, 15, 20]) {
        const wc = readingTimeToWordCount(level, minutes);
        expect(wordCountToReadingTime(level, wc), `${level} ${minutes}min`).toBe(minutes);
      }
    }
  });

  it("returns a positive integer", () => {
    expect(wordCountToReadingTime("infantil", 300)).toBeGreaterThan(0);
    expect(Number.isInteger(wordCountToReadingTime("adulto", 2000))).toBe(true);
  });
});

// ─── READING_LEVEL_CONFIG ─────────────────────────────────────────────────────

describe("READING_LEVEL_CONFIG", () => {
  it("all 6 levels are defined", () => {
    for (const level of ALL_LEVELS) {
      expect(READING_LEVEL_CONFIG[level]).toBeDefined();
    }
  });

  it("each level has required fields", () => {
    for (const level of ALL_LEVELS) {
      const cfg = READING_LEVEL_CONFIG[level];
      expect(cfg.wpm).toBeGreaterThan(0);
      expect(cfg.label).toBeTruthy();
      expect(cfg.cefr).toBeTruthy();
      expect(cfg.levelInstructions.length).toBeGreaterThan(50);
    }
  });

  it("wpm strictly increases from infantil to adulto", () => {
    const wpms = ALL_LEVELS.map((l) => READING_LEVEL_CONFIG[l].wpm);
    for (let i = 1; i < wpms.length; i++) {
      expect(wpms[i], `${ALL_LEVELS[i]} wpm should > ${ALL_LEVELS[i - 1]} wpm`).toBeGreaterThan(wpms[i - 1]);
    }
  });

  it("CEFR levels follow A1→A2→B1→B2→C1→C2 order", () => {
    const expected = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const actual = ALL_LEVELS.map((l) => READING_LEVEL_CONFIG[l].cefr);
    expect(actual).toEqual(expected);
  });
});

// ─── getLevelInstructions ─────────────────────────────────────────────────────

describe("getLevelInstructions", () => {
  it("returns a non-empty string for every level", () => {
    for (const level of ALL_LEVELS) {
      const instr = getLevelInstructions(level);
      expect(typeof instr).toBe("string");
      expect(instr.length).toBeGreaterThan(50);
    }
  });

  it("instructions reference the level name", () => {
    expect(getLevelInstructions("infantil")).toContain("Infantil");
    expect(getLevelInstructions("adulto")).toContain("Adulto");
  });
});
