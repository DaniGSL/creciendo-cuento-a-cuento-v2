import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { hashCode, decryptLabel } from "@/lib/auth/hash";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(s: string | null): s is string {
  return !!s && ISO_DATE_RE.test(s);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = createServerClient();

    const { searchParams } = req.nextUrl;
    let dateFrom = searchParams.get("dateFrom");
    let dateTo   = searchParams.get("dateTo");
    const language = searchParams.get("language") || null;
    const genre    = searchParams.get("genre")    || null;
    const level    = searchParams.get("level")    || null;
    const search   = searchParams.get("search")?.trim().toLowerCase() || null;

    if (!validDate(dateFrom)) dateFrom = null;
    if (!validDate(dateTo))   dateTo   = null;
    if (dateFrom && dateTo && dateFrom > dateTo) { [dateFrom, dateTo] = [dateTo, dateFrom]; }

    // Build label lookup maps in parallel with story query
    const [codesRes, profilesRes] = await Promise.all([
      supabase.from("access_codes").select("code, label"),
      supabase.from("profiles").select("id, code_hash"),
    ]);

    // hash → label map
    const hashToLabel = new Map<string, string | null>();
    for (const ac of codesRes.data ?? []) {
      hashToLabel.set(
        hashCode(ac.code),
        ac.label ? (decryptLabel(ac.label) ?? null) : null
      );
    }

    // profileId → label map
    const profileLabel = new Map<string, string | null>();
    for (const p of profilesRes.data ?? []) {
      profileLabel.set(p.id, hashToLabel.get(p.code_hash) ?? null);
    }

    // Build stories query with DB-side filters
    let q = supabase
      .from("stories")
      .select("id, profile_id, title, content, genre, language, reading_level, reading_time, characters, is_favorite, rating, created_at")
      .order("created_at", { ascending: false });

    if (dateFrom) q = q.gte("created_at", dateFrom + "T00:00:00.000Z");
    if (dateTo)   q = q.lte("created_at", dateTo   + "T23:59:59.999Z");
    if (language) q = q.eq("language", language);
    if (genre)    q = q.eq("genre", genre);
    if (level)    q = q.eq("reading_level", level);

    const { data: stories, error } = await q;
    if (error) throw error;

    let result = (stories ?? []).map((s) => ({
      id:            s.id,
      profileId:     s.profile_id,
      label:         profileLabel.get(s.profile_id) ?? null,
      title:         s.title,
      content:       s.content,
      genre:         s.genre,
      language:      s.language,
      reading_level: s.reading_level,
      reading_time:  s.reading_time,
      characters:    s.characters,
      is_favorite:   s.is_favorite,
      rating:        s.rating,
      created_at:    s.created_at,
    }));

    // JS-side search against title AND resolved label
    if (search) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(search) ||
          (s.label ?? "").toLowerCase().includes(search)
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/admin/biblioteca error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
