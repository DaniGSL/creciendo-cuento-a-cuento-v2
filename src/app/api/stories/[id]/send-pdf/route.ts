import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

const TO_EMAIL = process.env.PRINT_EMAIL ?? "creciendocuentoacuento@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

const BodySchema = z.object({
  pdfBase64: z.string().min(100, "PDF data missing"),
});

type RouteContext = { params: Promise<{ id: string }> };

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

    // Build character list for email body
    const characterNames = Array.isArray(story.characters)
      ? (story.characters as { name: string }[]).map((c) => c.name).join(", ")
      : "";

    // Send email with PDF attachment
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Cuento: ${story.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1F2937;">
          <h2 style="color:#2d5b9f;">${story.title}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#6B7280;">Género</td><td>${story.genre}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Idioma</td><td>${story.language}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Nivel</td><td>${story.reading_level}</td></tr>
            <tr><td style="padding:4px 0;color:#6B7280;">Duración</td><td>${story.reading_time} min</td></tr>
            ${characterNames ? `<tr><td style="padding:4px 0;color:#6B7280;">Personajes</td><td>${characterNames}</td></tr>` : ""}
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
