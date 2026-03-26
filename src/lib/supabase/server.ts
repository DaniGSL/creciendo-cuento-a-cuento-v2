import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * This bypasses RLS — only use in API routes and Server Components.
 * NEVER import this in client components or expose service_role key to browser.
 *
 * Note: Using untyped client here — will be replaced with generated types
 * after running: npx supabase gen types typescript --project-id <id>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { persistSession: false },
  });
}
