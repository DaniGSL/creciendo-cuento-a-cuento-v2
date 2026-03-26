import crypto from "crypto";

/**
 * One-way hash of an access code using SHA-256 + server-side salt.
 * This links access_codes ↔ profiles without storing the code in plain text
 * and without a DB foreign key between the two tables.
 */
export function hashCode(code: string): string {
  const salt = process.env.CODE_HASH_SALT;
  if (!salt) throw new Error("CODE_HASH_SALT is not set");
  return crypto
    .createHmac("sha256", salt)
    .update(code.toUpperCase().trim())
    .digest("hex");
}

/**
 * Simple AES-256-GCM encrypt for admin labels stored in access_codes.
 * Returns a hex string: iv(24 hex) + ":" + authTag(32 hex) + ":" + ciphertext(hex)
 */
export function encryptLabel(plaintext: string): string {
  const keyHex = process.env.LABEL_ENCRYPTION_KEY;
  if (!keyHex) throw new Error("LABEL_ENCRYPTION_KEY is not set");
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypt an AES-256-GCM encrypted label.
 * Returns null if decryption fails (corrupt data or wrong key).
 */
export function decryptLabel(encrypted: string): string | null {
  try {
    const keyHex = process.env.LABEL_ENCRYPTION_KEY;
    if (!keyHex) throw new Error("LABEL_ENCRYPTION_KEY is not set");
    const key = Buffer.from(keyHex, "hex");
    const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}
