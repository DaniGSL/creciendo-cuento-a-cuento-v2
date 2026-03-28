import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/jwt";

const LoginSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const adminCode = process.env.ADMIN_SECRET_CODE;
    if (!adminCode) {
      console.error("ADMIN_SECRET_CODE is not set");
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    if (parsed.data.code !== adminCode) {
      // Delay to slow down brute force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Código de administrador incorrecto" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, adminCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
