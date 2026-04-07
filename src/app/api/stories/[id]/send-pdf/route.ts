import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { hashCode, decryptLabel } from "@/lib/auth/hash";

const TO_EMAIL = process.env.PRINT_EMAIL ?? "creciendocuentoacuento@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

const BodySchema = z.object({
  pdfBase64: z.string().min(100, "PDF data missing"),
});

type RouteContext = { params: Promise<{ id: string }> };

/** Looks up the admin label for the profile that sent the request.
 *  Iterates access_codes (service role, bypasses RLS) and finds the one
 *  whose HMAC hash matches the profile's code_hash. Returns null if not found. */
async function resolveProfileLabel(profileId: string): Promise<string | null> {
  try {
    const supabase = createServerClient();

    // 1. Get the profile's code_hash
    const { data: profile } = await supabase
      .from("profiles")
      .select("code_hash")
      .eq("id", profileId)
      .single();

    if (!profile?.code_hash) return null;

    // 2. Scan all access codes and find the one whose hash matches
    const { data: codes } = await supabase
      .from("access_codes")
      .select("code, label");

    if (!codes?.length) return null;

    for (const row of codes) {
      if (hashCode(row.code) === profile.code_hash) {
        return row.label ? decryptLabel(row.label) : null;
      }
    }

    return null;
  } catch {
    return null; // Never block the email send because of this
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Validate body
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incorrectos" }, { status: 400 });
    }

    // Verify story belongs to this profile
    const supabase = createServerClient();
    const { data: story, error: dbError } = await supabase
      .from("stories")
      .select("id, title, genre, language, reading_level, reading_time, characters")
      .eq("id", id)
      .eq("profile_id", session.profileId)
      .single();

    if (dbError || !story) {
      return NextResponse.json({ error: "Cuento no encontrado" }, { status: 404 });
    }

    // Resolve admin label (e.g. "Familia García") — best effort, non-blocking
    const familyLabel = await resolveProfileLabel(session.profileId);

    // Build character list for email body
    const characterNames = Array.isArray(story.characters)
      ? (story.characters as { name: string }[]).map((c) => c.name).join(", ")
      : "";

    // Send email with PDF attachment
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: familyLabel
        ? `Cuento de ${familyLabel}: ${story.title}`
        : `Cuento: ${story.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1F2937;">
          ${familyLabel
            ? `<p style="font-size:13px;font-weight:600;color:#2d5b9f;margin:0 0 4px 0;">
                 📋 ${familyLabel}
               </p>`
            : ""}
          <h2 style="color:#1F2937;margin:0 0 16px 0;">${story.title}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#6B7280;width:90px;">Género</td><td>${story.genre}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Idioma</td><td>${story.language}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Nivel</td><td>${story.reading_level}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Duración</td><td>${story.reading_time} min</td></tr>
            ${characterNames
              ? `<tr><td style="padding:4px 0;color:#6B7280;">Personajes</td><td>${characterNames}</td></tr>`
              : ""}
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9CA3AF;">
            Generado con <em>Creciendo Cuento a Cuento</em>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${story.title.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
          content: Buffer.from(parsed.data.pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ error: "No se pudo enviar el email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("POST /api/stories/[id]/send-pdf error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
