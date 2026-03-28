import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

const UpdateCharacterSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().min(1).max(500).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateCharacterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("characters")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== session.profileId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("characters")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PUT /api/characters/[id] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("characters")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== session.profileId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("DELETE /api/characters/[id] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
