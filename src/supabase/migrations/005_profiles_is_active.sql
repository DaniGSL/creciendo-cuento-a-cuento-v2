-- Add is_active flag to profiles for session revocation.
-- When an admin deactivates or deletes an access code, the corresponding
-- profiles row is marked is_active = false, causing requireSession() to
-- reject further requests from that profile.

ALTER TABLE profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
