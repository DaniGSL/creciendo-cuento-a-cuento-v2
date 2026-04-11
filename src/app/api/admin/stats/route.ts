import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(s: string | null): s is string {
  return !!s && ISO_DATE_RE.test(s);
}

function toISOWeek(dateStr: string): string {
  const d = new Date(dateStr);
  // Start of the ISO week (Monday)
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function durationBucket(minutes: number): number {
  // Return exact value; unexpected values fall through as-is
  return minutes;
}

type RawStory = {
  profile_id: string;
  genre: string;
  language: string;
  reading_level: string;
  reading_time: number;
  rating: number | null;
  is_favorite: boolean;
  created_at: string;
};

function aggregateStories(stories: RawStory[]) {
  const genreMap   = new Map<string, { count: number; rsum: number; rn: number }>();
  const levelMap   = new Map<string, { count: number; rsum: number; rn: number }>();
  const langMap    = new Map<string, { count: number; rsum: number; rn: number }>();
  const durMap     = new Map<number, { count: number; rsum: number; rn: number }>();
  const weekMap    = new Map<string, number>();
  const profileSet = new Set<string>();

  let totalStories = 0;
  let ratingSum = 0;
  let ratingN = 0;
  let favorites = 0;

  for (const s of stories) {
    totalStories++;
    profileSet.add(s.profile_id);
    if (s.rating)      { ratingSum += s.rating; ratingN++; }
    if (s.is_favorite) { favorites++; }

    // Genre
    const g = genreMap.get(s.genre) ?? { count: 0, rsum: 0, rn: 0 };
    g.count++; if (s.rating) { g.rsum += s.rating; g.rn++; } genreMap.set(s.genre, g);

    // Level
    const l = levelMap.get(s.reading_level) ?? { count: 0, rsum: 0, rn: 0 };
    l.count++; if (s.rating) { l.rsum += s.rating; l.rn++; } levelMap.set(s.reading_level, l);

    // Language
    const la = langMap.get(s.language) ?? { count: 0, rsum: 0, rn: 0 };
    la.count++; if (s.rating) { la.rsum += s.rating; la.rn++; } langMap.set(s.language, la);

    // Duration (exact minutes: 5, 10, 15, 20)
    const dur = durationBucket(s.reading_time);
    const d = durMap.get(dur) ?? { count: 0, rsum: 0, rn: 0 };
    d.count++; if (s.rating) { d.rsum += s.rating; d.rn++; } durMap.set(dur, d);

    // Weekly (last 8 ISO weeks of the filtered set)
    const wk = toISOWeek(s.created_at);
    weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const toRating = (rsum: number, rn: number) => rn > 0 ? round1(rsum / rn) : null;

  const LEVEL_ORDER = ["infantil","primaria_baja","primaria_media","primaria_alta","secundaria","adulto"];

  return {
    stories: totalStories,
    activeProfiles: profileSet.size,
    avgRating: ratingN > 0 ? round1(ratingSum / ratingN) : null,
    ratedCount: ratingN,
    favoritesCount: favorites,
    genreStats: [...genreMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([genre, v]) => ({ genre, count: v.count, avgRating: toRating(v.rsum, v.rn) })),
    levelStats: [...levelMap.entries()]
      .sort((a, b) => LEVEL_ORDER.indexOf(a[0]) - LEVEL_ORDER.indexOf(b[0]))
      .map(([level, v]) => ({ level, count: v.count, avgRating: toRating(v.rsum, v.rn) })),
    languageStats: [...langMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([language, v]) => ({ language, count: v.count, avgRating: toRating(v.rsum, v.rn) })),
    durationStats: [...durMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([minutes, v]) => ({ minutes, count: v.count, avgRating: toRating(v.rsum, v.rn) })),
    weeklyStats: [...weekMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, count]) => ({ week, count })),
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo   = searchParams.get("dateTo");
    const lang     = searchParams.get("lang");

    // Swap if inverted
    let from = validDate(dateFrom) ? dateFrom : null;
    let to   = validDate(dateTo)   ? dateTo   : null;
    if (from && to && from > to) { [from, to] = [to, from]; }

    const hasFilter = !!(from || to || lang);

    const supabase = createServerClient();

    // Codes are always global (unfiltered)
    const codesRes = await supabase.from("access_codes").select("is_active");
    const codes = codesRes.data ?? [];

    if (!hasFilter) {
      // ── Fast path: use SQL views ──────────────────────────────────────────
      const [
        storyStatsRes,
        genreStatsRes,
        levelStatsRes,
        weeklyStatsRes,
        langStatsRes,
        durStatsRes,
      ] = await Promise.all([
        supabase.from("admin_story_stats").select("*").single(),
        supabase.from("admin_genre_stats").select("genre, count, avg_rating"),
        supabase.from("admin_level_stats").select("reading_level, count, avg_rating"),
        supabase.from("admin_weekly_stats").select("week, stories_created"),
        supabase.from("admin_language_stats").select("language, count, avg_rating"),
        // Exact duration grouping — direct query instead of the bucket-based view
        supabase.from("stories").select("reading_time, rating"),
      ]);

      const ss = storyStatsRes.data;
      const round1 = (n: number) => Math.round(n * 10) / 10;

      // Build exact duration stats from raw reading_time values
      const durMap = new Map<number, { count: number; rsum: number; rn: number }>();
      for (const row of durStatsRes.data ?? []) {
        const e = durMap.get(row.reading_time) ?? { count: 0, rsum: 0, rn: 0 };
        e.count++;
        if (row.rating) { e.rsum += row.rating; e.rn++; }
        durMap.set(row.reading_time, e);
      }
      const toRating = (rsum: number, rn: number) => rn > 0 ? round1(rsum / rn) : null;

      return NextResponse.json({
        codes: {
          total:    codes.length,
          active:   codes.filter((c) => c.is_active).length,
          inactive: codes.filter((c) => !c.is_active).length,
        },
        profiles:      Number(ss?.active_profiles ?? 0),
        stories:       Number(ss?.total_stories ?? 0),
        avgRating:     ss?.avg_rating != null ? round1(Number(ss.avg_rating)) : null,
        ratedCount:    Number(ss?.rated_count ?? 0),
        favoritesCount:Number(ss?.favorites_count ?? 0),
        genreStats: (genreStatsRes.data ?? []).map((g) => ({
          genre: g.genre,
          count: Number(g.count),
          avgRating: g.avg_rating != null ? round1(Number(g.avg_rating)) : null,
        })),
        levelStats: (levelStatsRes.data ?? []).map((l) => ({
          level: l.reading_level,
          count: Number(l.count),
          avgRating: l.avg_rating != null ? round1(Number(l.avg_rating)) : null,
        })),
        languageStats: (langStatsRes.data ?? []).map((l) => ({
          language: l.language,
          count: Number(l.count),
          avgRating: l.avg_rating != null ? round1(Number(l.avg_rating)) : null,
        })),
        durationStats: [...durMap.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([minutes, v]) => ({ minutes, count: v.count, avgRating: toRating(v.rsum, v.rn) })),
        weeklyStats: (weeklyStatsRes.data ?? []).map((w) => ({
          week: w.week,
          count: Number(w.stories_created),
        })),
      });
    }

    // ── Filtered path: raw query + JS aggregation ────────────────────────────
    let q = supabase
      .from("stories")
      .select("profile_id, genre, language, reading_level, reading_time, rating, is_favorite, created_at");

    if (from) q = q.gte("created_at", from + "T00:00:00.000Z");
    if (to)   q = q.lte("created_at", to   + "T23:59:59.999Z");
    if (lang) q = q.eq("language", lang);

    const { data: stories, error } = await q;
    if (error) throw error;

    const agg = aggregateStories(stories ?? []);

    return NextResponse.json({
      codes: {
        total:    codes.length,
        active:   codes.filter((c) => c.is_active).length,
        inactive: codes.filter((c) => !c.is_active).length,
      },
      profiles:      agg.activeProfiles,
      stories:       agg.stories,
      avgRating:     agg.avgRating,
      ratedCount:    agg.ratedCount,
      favoritesCount:agg.favoritesCount,
      genreStats:    agg.genreStats,
      levelStats:    agg.levelStats,
      languageStats: agg.languageStats,
      durationStats: agg.durationStats,
      weeklyStats:   agg.weeklyStats,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/admin/stats error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
