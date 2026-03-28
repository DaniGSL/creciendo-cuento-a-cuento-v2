/**
 * Vitest global setup — provides environment variables required by
 * src/lib/auth/hash.ts and other server-side utilities under test.
 *
 * These are fake keys; they must NEVER be used in production.
 */

// 32-char string — used as HMAC-SHA256 salt
process.env.CODE_HASH_SALT = "vitest-test-salt-do-not-use-prod";

// 64-char hex string = 32 bytes — required for AES-256-GCM
process.env.LABEL_ENCRYPTION_KEY = "a".repeat(64);

// JWT secret for token signing (not exercised in unit tests but some modules read it)
process.env.JWT_SECRET = "vitest-test-jwt-secret-not-for-production-use";
