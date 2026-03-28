import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createServerClient();

    const [
      codesRes,
      storyStatsRes,
      genreStatsRes,
      levelStatsRes,
      weeklyStatsRes,
    ] = await Promise.all([
      // Codes: total + active count
      supabase
        .from("access_codes")
        .select("is_active"),

      // Global story stats from the admin view
      supabase
        .from("admin_story_stats")
        .select("*")
        .single(),

      // Genre breakdown
      supabase
        .from("admin_genre_stats")
        .select("genre, count, avg_rating"),

      // Level breakdown
      supabase
        .from("admin_level_stats")
        .select("reading_level, count, avg_rating"),

      // Weekly stats
      supabase
        .from("admin_weekly_stats")
        .select("week, stories_created"),
    ]);

    const codes = codesRes.data ?? [];
    const totalCodes = codes.length;
    const activeCodes = codes.filter((c) => c.is_active).length;

    const storyStats = storyStatsRes.data;

    return NextResponse.json({
      codes: {
        total: totalCodes,
        active: activeCodes,
        inactive: totalCodes - activeCodes,
      },
      profiles: Number(storyStats?.active_profiles ?? 0),
      stories: Number(storyStats?.total_stories ?? 0),
      avgRating:
        storyStats?.avg_rating !== null && storyStats?.avg_rating !== undefined
          ? Math.round(Number(storyStats.avg_rating) * 10) / 10
          : null,
      ratedCount: Number(storyStats?.rated_count ?? 0),
      favoritesCount: Number(storyStats?.favorites_count ?? 0),
      genreStats: (genreStatsRes.data ?? []).map((g) => ({
        genre: g.genre,
        count: Number(g.count),
        avgRating:
          g.avg_rating !== null
            ? Math.round(Number(g.avg_rating) * 10) / 10
            : null,
      })),
      levelStats: (levelStatsRes.data ?? []).map((l) => ({
        level: l.reading_level,
        count: Number(l.count),
        avgRating:
          l.avg_rating !== null
            ? Math.round(Number(l.avg_rating) * 10) / 10
            : null,
      })),
      weeklyStats: (weeklyStatsRes.data ?? []).map((w) => ({
        week: w.week,
        count: Number(w.stories_created),
      })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/admin/stats error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
