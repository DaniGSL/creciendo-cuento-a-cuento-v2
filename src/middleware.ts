import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE_NAME, ADMIN_COOKIE_NAME } from "@/lib/auth/jwt";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/acceso"];
// API routes that are public
const PUBLIC_API_ROUTES = ["/api/auth/login"];
// Routes that require admin cookie
const ADMIN_ROUTES = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ─────────────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    // Admin login page is always public
    if (pathname === "/admin/login") return NextResponse.next();

    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminCode = process.env.ADMIN_SECRET_CODE;

    if (!adminCookie || !adminCode || adminCookie !== adminCode) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Public API routes ─────────────────────────────────────────────
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── API routes — require valid JWT ────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session) {
      const response = NextResponse.json(
        { error: "Sesión expirada" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    return NextResponse.next();
  }

  // ── Public pages ──────────────────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // ── Protected pages — require valid JWT ───────────────────────────
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/acceso", request.url));
  }
  const session = await verifyToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL("/acceso", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
