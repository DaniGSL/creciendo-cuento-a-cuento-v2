import { cookies } from "next/headers";
import {
  verifyToken,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from "./jwt";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Read and verify the session cookie.
 * Use in Server Components — does NOT check DB is_active (lightweight).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Returns the session or throws a 401 Response.
 * Also verifies the profile is still active in DB (handles code revocation).
 * Convenience wrapper for API routes.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", session.profileId)
    .single();

  if (!data?.is_active) {
    throw new Response(JSON.stringify({ error: "Acceso revocado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}
