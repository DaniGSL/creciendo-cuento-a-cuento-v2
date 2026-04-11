import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { hashCode, decryptLabel } from "@/lib/auth/hash";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createServerClient();

    // 3 parallel queries — O(n+m+s) overall
    const [profilesRes, codesRes, storiesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, code_hash, is_active, created_at, last_access, lang_ui")
        .order("created_at", { ascending: false }),
      supabase
        .from("access_codes")
        .select("code, label"),
      supabase
        .from("stories")
        .select("profile_id, is_favorite, rating"),
    ]);

    // Build hash → label map — O(m)
    const hashToLabel = new Map<string, string | null>();
    for (const ac of codesRes.data ?? []) {
      hashToLabel.set(
        hashCode(ac.code),
        ac.label ? (decryptLabel(ac.label) ?? null) : null
      );
    }

    // Build profileId → story stats map — O(s)
    const pStats = new Map<string, { count: number; fav: number; rsum: number; rn: number }>();
    for (const s of storiesRes.data ?? []) {
      const e = pStats.get(s.profile_id) ?? { count: 0, fav: 0, rsum: 0, rn: 0 };
      e.count++;
      if (s.is_favorite) e.fav++;
      if (s.rating) { e.rsum += s.rating; e.rn++; }
      pStats.set(s.profile_id, e);
    }

    const result = (profilesRes.data ?? []).map((p) => {
      const label = hashToLabel.get(p.code_hash) ?? null;
      const st = pStats.get(p.id) ?? { count: 0, fav: 0, rsum: 0, rn: 0 };
      return {
        id:           p.id,
        label,
        is_active:    p.is_active,
        created_at:   p.created_at,
        last_access:  p.last_access,
        lang_ui:      p.lang_ui,
        storyCount:   st.count,
        favoritesCount: st.fav,
        avgRating: st.rn > 0
          ? Math.round((st.rsum / st.rn) * 10) / 10
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/admin/perfiles error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
