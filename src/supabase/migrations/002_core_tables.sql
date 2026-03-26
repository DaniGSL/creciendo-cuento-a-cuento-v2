-- ─── access_codes ────────────────────────────────────────────────────
-- Managed by admins only. NO foreign key to profiles (privacy by design).
-- The label column stores AES-256-GCM encrypted text (format: iv:authTag:ciphertext).
CREATE TABLE IF NOT EXISTS access_codes (
  code        TEXT PRIMARY KEY,
  label       TEXT,                              -- encrypted "Familia García"
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── profiles ────────────────────────────────────────────────────────
-- Anonymous profiles. No FK to access_codes — linked only via SHA-256 hash
-- computed server-side with CODE_HASH_SALT. code_hash is never the raw code.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash   TEXT NOT NULL UNIQUE,              -- HMAC-SHA256(code + salt)
  lang_ui     TEXT NOT NULL DEFAULT 'es',        -- UI language preference
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_access TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── characters ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS characters_profile_id_idx ON characters(profile_id);

-- ─── stories ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  genre         TEXT NOT NULL,
  language      TEXT NOT NULL,
  reading_level TEXT NOT NULL,  -- infantil|primaria_baja|primaria_media|primaria_alta|secundaria|adulto
  reading_time  INTEGER NOT NULL,  -- minutes
  characters    JSONB NOT NULL DEFAULT '[]',  -- snapshot [{id, name, description}]
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),  -- nullable, 1-5 stars
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_profile_id_idx ON stories(profile_id);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS stories_genre_idx ON stories(genre);
CREATE INDEX IF NOT EXISTS stories_language_idx ON stories(language);
CREATE INDEX IF NOT EXISTS stories_reading_level_idx ON stories(reading_level);
