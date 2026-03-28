import { describe, it, expect } from "vitest";
import { hashCode, encryptLabel, decryptLabel } from "@/lib/auth/hash";

// ─── hashCode ─────────────────────────────────────────────────────────────────

describe("hashCode", () => {
  it("returns a 64-char lowercase hex string", () => {
    const hash = hashCode("LUNA-SOL-NUBE-9743");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input always yields same hash", () => {
    expect(hashCode("LUNA-SOL-NUBE-9743")).toBe(hashCode("LUNA-SOL-NUBE-9743"));
  });

  it("normalises to uppercase before hashing", () => {
    expect(hashCode("luna-sol-nube-9743")).toBe(hashCode("LUNA-SOL-NUBE-9743"));
  });

  it("strips leading/trailing whitespace before hashing", () => {
    expect(hashCode("  LUNA-SOL-NUBE-9743  ")).toBe(hashCode("LUNA-SOL-NUBE-9743"));
  });

  it("different codes produce different hashes", () => {
    const a = hashCode("LUNA-SOL-NUBE-9743");
    const b = hashCode("LUNA-SOL-NUBE-1234");
    const c = hashCode("GATO-OSO-LOBO-5678");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});

// ─── encryptLabel / decryptLabel ──────────────────────────────────────────────

describe("encryptLabel + decryptLabel", () => {
  it("roundtrips ASCII plaintext", () => {
    const plain = "Familia Garcia";
    expect(decryptLabel(encryptLabel(plain))).toBe(plain);
  });

  it("roundtrips Unicode / accented characters", () => {
    const plain = "Família García – UCIN 2026";
    expect(decryptLabel(encryptLabel(plain))).toBe(plain);
  });

  it("encrypted form never contains the plaintext", () => {
    const plain = "Familia Secreta";
    const cipher = encryptLabel(plain);
    expect(cipher).not.toContain(plain);
    expect(cipher).not.toContain("Secreta");
  });

  it("produces a three-part iv:tag:ciphertext hex string", () => {
    const cipher = encryptLabel("test");
    const parts = cipher.split(":");
    expect(parts).toHaveLength(3);
    // iv = 12 bytes = 24 hex chars; authTag = 16 bytes = 32 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{24}$/);
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });

  it("each encryption produces a unique ciphertext (random IV)", () => {
    const cipher1 = encryptLabel("same text");
    const cipher2 = encryptLabel("same text");
    expect(cipher1).not.toBe(cipher2); // different IVs
    // But both decrypt to the same plaintext
    expect(decryptLabel(cipher1)).toBe(decryptLabel(cipher2));
  });

  it("returns null for garbage input", () => {
    expect(decryptLabel("not:valid:hex")).toBeNull();
    expect(decryptLabel("totally-wrong")).toBeNull();
    expect(decryptLabel("aa:bb")).toBeNull(); // wrong number of parts
  });
});
