import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("profile_id", session.profileId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/characters error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateCharacterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("characters")
      .insert({ ...parsed.data, profile_id: session.profileId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("POST /api/characters error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
