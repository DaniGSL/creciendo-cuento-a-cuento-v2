import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

/**
 * Logros de gamificación. Se calculan al vuelo a partir de los cuentos del
 * perfil — sin tablas nuevas. `top_family_week` compara (de forma anónima)
 * los cuentos creados esta semana por todas las familias.
 */

export interface Achievement {
  id: string;
  emoji: string;
  achieved: boolean;
  progress: number; // valor actual
  target: number; // objetivo
}

type StoryRow = {
  language: string;
  reading_time: number | null;
  rating: number | null;
  is_favorite: boolean;
  saga_id: string | null;
  chapter_number: number | null;
  created_at: string;
};

/** Lunes (00:00 UTC) de la semana ISO de una fecha. */
function isoWeekStart(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await requireSession();
    const supabase = createServerClient();

    const weekStartIso = isoWeekStart(new Date()) + "T00:00:00.000Z";

    const [storiesRes, weekRes] = await Promise.all([
      supabase
        .from("stories")
        .select(
          "language, reading_time, rating, is_favorite, saga_id, chapter_number, created_at"
        )
        .eq("profile_id", session.profileId),
      // Cuentos de TODAS las familias esta semana (solo profile_id, anónimo)
      supabase
        .from("stories")
        .select("profile_id")
        .gte("created_at", weekStartIso),
    ]);

    const stories = (storiesRes.data ?? []) as StoryRow[];

    // ── Métricas base ──────────────────────────────────────────────────
    const totalStories = stories.length;
    const totalMinutes = stories.reduce((s, x) => s + (x.reading_time ?? 0), 0);
    const ratedCount = stories.filter((s) => s.rating !== null).length;
    const favoritesCount = stories.filter((s) => s.is_favorite).length;
    const languages = new Set(stories.map((s) => s.language)).size;

    // Sagas: capítulos por saga_id
    const sagaSizes = new Map<string, number>();
    for (const s of stories) {
      if (s.saga_id) sagaSizes.set(s.saga_id, (sagaSizes.get(s.saga_id) ?? 0) + 1);
    }
    const sagasStarted = sagaSizes.size;
    const maxSagaLength = Math.max(0, ...sagaSizes.values());

    // Racha: semanas ISO consecutivas (hasta la actual o la anterior) con cuentos
    const weeksWithStories = new Set(
      stories.map((s) => isoWeekStart(new Date(s.created_at)))
    );
    let streak = 0;
    const cursor = new Date();
    // Si esta semana aún no hay cuento, la racha puede seguir viva desde la anterior
    if (!weeksWithStories.has(isoWeekStart(cursor))) {
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    }
    while (weeksWithStories.has(isoWeekStart(cursor))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    }

    // Familia más lectora de la semana (anónimo: solo recuentos)
    const weekCounts = new Map<string, number>();
    for (const row of weekRes.data ?? []) {
      weekCounts.set(row.profile_id, (weekCounts.get(row.profile_id) ?? 0) + 1);
    }
    const myWeekCount = weekCounts.get(session.profileId) ?? 0;
    const maxWeekCount = Math.max(0, ...weekCounts.values());
    const isTopFamily = myWeekCount > 0 && myWeekCount === maxWeekCount;

    // ── Logros ─────────────────────────────────────────────────────────
    const a = (
      id: string,
      emoji: string,
      progress: number,
      target: number
    ): Achievement => ({
      id,
      emoji,
      achieved: progress >= target,
      progress: Math.min(progress, target),
      target,
    });

    const achievements: Achievement[] = [
      a("first_story", "📖", totalStories, 1),
      a("stories_5", "✍️", totalStories, 5),
      a("stories_25", "🏆", totalStories, 25),
      a("stories_50", "👑", totalStories, 50),
      a("first_saga", "📚", sagasStarted, 1),
      a("saga_complete", "🐉", maxSagaLength, 5),
      a("polyglot", "🌍", languages, 3),
      a("critic", "⭐", ratedCount, 5),
      a("collector", "❤️", favoritesCount, 5),
      a("reading_60", "⏱️", totalMinutes, 60),
      a("reading_300", "🌙", totalMinutes, 300),
      a("streak_3", "🔥", streak, 3),
      a("top_family_week", "🥇", isTopFamily ? 1 : 0, 1),
    ];

    return NextResponse.json({
      achievements,
      achievedCount: achievements.filter((x) => x.achieved).length,
      total: achievements.length,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/profile/achievements error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
