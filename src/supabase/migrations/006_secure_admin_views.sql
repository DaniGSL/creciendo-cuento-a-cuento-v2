-- ─── Secure admin stats views ─────────────────────────────────────────
-- The admin_* views were created with the default SECURITY DEFINER
-- behaviour and inherited PostgREST's default grants, which made them
-- readable by the public `anon` role (bypassing the RLS on stories).
-- The server only ever queries them with the service_role key, which
-- bypasses RLS anyway, so we can lock them down completely:
--   1. security_invoker = true → the view runs with the caller's
--      permissions instead of the owner's (no more RLS bypass).
--   2. Revoke every grant from anon and authenticated.

ALTER VIEW admin_story_stats    SET (security_invoker = true);
ALTER VIEW admin_genre_stats    SET (security_invoker = true);
ALTER VIEW admin_level_stats    SET (security_invoker = true);
ALTER VIEW admin_language_stats SET (security_invoker = true);
ALTER VIEW admin_duration_stats SET (security_invoker = true);
ALTER VIEW admin_weekly_stats   SET (security_invoker = true);

REVOKE ALL ON admin_story_stats    FROM anon, authenticated;
REVOKE ALL ON admin_genre_stats    FROM anon, authenticated;
REVOKE ALL ON admin_level_stats    FROM anon, authenticated;
REVOKE ALL ON admin_language_stats FROM anon, authenticated;
REVOKE ALL ON admin_duration_stats FROM anon, authenticated;
REVOKE ALL ON admin_weekly_stats   FROM anon, authenticated;

-- rls_auto_enable() is an internal event-trigger helper; it must not be
-- callable through the public RPC API.
REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC, anon, authenticated;
