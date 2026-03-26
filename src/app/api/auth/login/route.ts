import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";
import { hashCode } from "@/lib/auth/hash";

const LoginSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((v) => v.toUpperCase().trim())
    .refine(
      (v) => /^[A-ZÁÉÍÓÚÑ]+-[A-ZÁÉÍÓÚÑ]+-[A-ZÁÉÍÓÚÑ]+-\d{4}$/.test(v),
      { message: "Formato de código inválido" }
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Código no válido. Formato: PALABRA-PALABRA-PALABRA-NNNN" },
        { status: 400 }
      );
    }

    const { code } = parsed.data;
    const supabase = createServerClient();

    // 1. Check the code exists and is active in access_codes
    const { data: accessCode, error: codeError } = await supabase
      .from("access_codes")
      .select("code, is_active")
      .eq("code", code)
      .single();

    if (codeError || !accessCode || !accessCode.is_active) {
      return NextResponse.json(
        { error: "Código no válido o desactivado" },
        { status: 401 }
      );
    }

    // 2. Compute the code hash — this is the only link to profiles
    const codeHash = hashCode(code);

    // 3. Find or create the profile (upsert by code_hash)
    let profileId: string;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("code_hash", codeHash)
      .single();

    if (existingProfile) {
      profileId = existingProfile.id;
      // Update last_access
      await supabase
        .from("profiles")
        .update({ last_access: new Date().toISOString() })
        .eq("id", profileId);
    } else {
      // First time this code is used — create a new anonymous profile
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ code_hash: codeHash })
        .select("id")
        .single();

      if (insertError || !newProfile) {
        console.error("Error creating profile:", insertError);
        return NextResponse.json(
          { error: "Error al crear el perfil" },
          { status: 500 }
        );
      }
      profileId = newProfile.id;
    }

    // 4. Sign JWT and set HttpOnly cookie
    const token = await signToken({ profileId });

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
