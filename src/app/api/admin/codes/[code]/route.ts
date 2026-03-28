import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type RouteContext = { params: Promise<{ code: string }> };

// ─── PATCH — toggle is_active ─────────────────────────────────────────────────

const PatchSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { code } = await params;
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("access_codes")
      .update({ is_active: parsed.data.is_active })
      .eq("code", code);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PATCH /api/admin/codes/[code] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ─── DELETE — remove code ─────────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { code } = await params;

    const supabase = createServerClient();
    const { error } = await supabase
      .from("access_codes")
      .delete()
      .eq("code", code);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("DELETE /api/admin/codes/[code] error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
