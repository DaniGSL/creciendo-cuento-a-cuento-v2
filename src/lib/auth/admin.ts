import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "./jwt";

/**
 * Verifies that the request has a valid admin cookie.
 * Throws a 401 Response if not — same pattern as requireSession().
 * Use in /api/admin/* route handlers for defense-in-depth
 * (the proxy already checks, but this ensures API routes return proper JSON 401).
 */
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminCode = process.env.ADMIN_SECRET_CODE;

  if (!cookie || !adminCode || cookie !== adminCode) {
    throw new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
