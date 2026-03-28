import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const supabase = createServerClient();
    const { searchParams } = request.nextUrl;

    let query = supabase
      .from("stories")
      .select("*")
      .eq("profile_id", session.profileId)
      .order("created_at", { ascending: false });

    const genre = searchParams.get("genre");
    const language = searchParams.get("language");
    const favorite = searchParams.get("favorite");

    if (genre) query = query.eq("genre", genre);
    if (language) query = query.eq("language", language);
    if (favorite === "true") query = query.eq("is_favorite", true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/stories error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
