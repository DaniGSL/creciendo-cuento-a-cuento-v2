import { cookies } from "next/headers";
import {
  verifyToken,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from "./jwt";

/**
 * Read and verify the session cookie.
 * Use in Server Components and API Route handlers.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Returns the session or throws a 401 Response.
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
  return session;
}
