/**
 * wordlist.ts — Spanish word list and access-code generator for the admin panel.
 * Words are chosen without accents so families can type them easily.
 * Format: PALABRA-PALABRA-PALABRA-NNNN
 */

export const WORDS: readonly string[] = [
  "LUNA",    "SOL",    "MAR",    "CIELO",  "NUBE",   "VIENTO",  "AGUA",   "FUEGO",
  "TIERRA",  "BOSQUE", "RIO",    "LAGO",   "FLOR",   "ARBOL",   "PAJARO", "PRADO",
  "GATO",    "PERRO",  "LOBO",   "OSO",    "PANDA",  "ZORRO",   "CONEJO", "TIGRE",
  "LEON",    "DELFIN", "GARZA",  "CIERVO", "ESTRELLA","COMETA", "LIBRO",  "CUENTO",
  "MAGIA",   "AMOR",   "PAZ",    "RISA",   "NOBLE",  "SABIO",   "DULCE",  "FUERTE",
  "NIEVE",   "LLUVIA", "AURORA", "BRISA",  "CRISTAL","PERLA",   "BRILLO", "CANTO",
  "VUELO",   "CAMPO",  "ROCA",   "CORAL",  "CEDRO",  "ROBLE",   "SAUCE",  "MIEL",
  "LIMON",   "PINO",   "MUSGO",  "ARENA",  "ONDA",   "NIEBLA",
] as const;

/**
 * Generates a single access code in PALABRA-PALABRA-PALABRA-NNNN format.
 * Picks 3 unique words at random + a 4-digit number (1000–9999).
 */
export function generateCode(): string {
  const selected = pickDistinct([...WORDS], 3);
  const digits = String(1000 + Math.floor(Math.random() * 9000));
  return [...selected, digits].join("-");
}

/**
 * Generates N distinct access codes.
 * Retries up to 3× per slot to avoid (very rare) duplicates in the batch.
 */
export function generateCodes(count: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  let attempts = 0;
  while (result.length < count && attempts < count * 4) {
    const code = generateCode();
    if (!seen.has(code)) {
      seen.add(code);
      result.push(code);
    }
    attempts++;
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickDistinct<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
