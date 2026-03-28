import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireSession();
    const supabase = createServerClient();
    const pid = session.profileId;

    const [storiesRes, charactersRes, profileRes] = await Promise.all([
      supabase
        .from("stories")
        .select("reading_time, is_favorite, rating")
        .eq("profile_id", pid),
      supabase
        .from("characters")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", pid),
      supabase
        .from("profiles")
        .select("lang_ui, created_at")
        .eq("id", pid)
        .single(),
    ]);

    const stories = storiesRes.data ?? [];
    const totalStories = stories.length;
    const totalCharacters = charactersRes.count ?? 0;
    const totalReadingMinutes = stories.reduce(
      (sum, s) => sum + (s.reading_time ?? 0),
      0
    );
    const favoritesCount = stories.filter((s) => s.is_favorite).length;
    const ratedStories = stories.filter((s) => s.rating !== null);
    const avgRating =
      ratedStories.length > 0
        ? ratedStories.reduce((sum, s) => sum + (s.rating ?? 0), 0) /
          ratedStories.length
        : null;

    const response = NextResponse.json({
      totalStories,
      totalCharacters,
      totalReadingMinutes,
      favoritesCount,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      langUi: profileRes.data?.lang_ui ?? "es",
      memberSince: profileRes.data?.created_at ?? null,
    });
    response.cookies.set("lang_ui", profileRes.data?.lang_ui ?? "es", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/profile error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

const PatchProfileSchema = z.object({
  lang_ui: z.string().min(2).max(10),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = PatchProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ lang_ui: parsed.data.lang_ui })
      .eq("id", session.profileId);

    if (error) throw error;
    const response = NextResponse.json({ success: true });
    response.cookies.set("lang_ui", parsed.data.lang_ui, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /api/profile error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
