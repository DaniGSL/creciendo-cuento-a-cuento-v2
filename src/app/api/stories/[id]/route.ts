import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

const UpdateStorySchema = z
  .object({
    is_favorite: z.boolean().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("profile_id", session.profileId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/stories/[id] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateStorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("stories")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== session.profileId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("stories")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /api/stories/[id] error:", e);
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
      .from("stories")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== session.profileId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("DELETE /api/stories/[id] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
