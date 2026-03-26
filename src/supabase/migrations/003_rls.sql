-- ─── Row Level Security ───────────────────────────────────────────────
-- All tables are accessed exclusively via the service_role key on the server.
-- The anon key (used if accidentally exposed to browser) gets zero access.

ALTER TABLE access_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories        ENABLE ROW LEVEL SECURITY;

-- Deny all access to the anon role (browser / unauthenticated requests)
CREATE POLICY "deny_anon_access_codes"  ON access_codes  FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_profiles"      ON profiles       FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_characters"    ON characters      FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_stories"       ON stories         FOR ALL TO anon USING (false);

-- Note: service_role bypasses RLS by default in Supabase.
-- No additional policies needed for server-side access.
