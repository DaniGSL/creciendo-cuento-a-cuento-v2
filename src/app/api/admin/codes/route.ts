import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { encryptLabel, decryptLabel } from "@/lib/auth/hash";
import { generateCodes } from "@/lib/admin/wordlist";

// ─── GET — list all codes ─────────────────────────────────────────────────────

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("access_codes")
      .select("code, label, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Decrypt labels server-side (never expose raw encrypted blobs to client)
    const codes = (data ?? []).map((row) => ({
      code: row.code,
      label: row.label ? (decryptLabel(row.label) ?? null) : null,
      is_active: row.is_active,
      created_at: row.created_at,
    }));

    return NextResponse.json(codes);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/admin/codes error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ─── POST — create one or multiple codes ──────────────────────────────────────

const CreateSingleSchema = z.object({
  label: z.string().max(100).trim().optional(),
});

const CreateBulkSchema = z.object({
  count: z.number().int().min(1).max(50),
  label_prefix: z.string().max(80).trim().optional(),
});

const CreateSchema = z.union([
  CreateSingleSchema.extend({ bulk: z.literal(false).optional() }),
  CreateBulkSchema.extend({ bulk: z.literal(true) }),
]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const isBulk = parsed.data.bulk === true;

    if (isBulk) {
      const { count, label_prefix } = parsed.data as z.infer<typeof CreateBulkSchema> & { bulk: true };

      // Generate N unique codes
      const rawCodes = generateCodes(count);

      // Check for duplicates with existing DB codes
      const { data: existing } = await supabase
        .from("access_codes")
        .select("code")
        .in("code", rawCodes);

      const existingSet = new Set((existing ?? []).map((r) => r.code));
      const uniqueCodes = rawCodes.filter((c) => !existingSet.has(c));

      if (uniqueCodes.length === 0) {
        return NextResponse.json(
          { error: "No se pudieron generar códigos únicos. Inténtalo de nuevo." },
          { status: 409 }
        );
      }

      const rows = uniqueCodes.map((code, i) => {
        const rawLabel = label_prefix ? `${label_prefix} ${i + 1}` : null;
        return {
          code,
          label: rawLabel ? encryptLabel(rawLabel) : null,
          is_active: true,
        };
      });

      const { data, error } = await supabase
        .from("access_codes")
        .insert(rows)
        .select("code, label, is_active, created_at");

      if (error) throw error;

      const result = (data ?? []).map((row) => ({
        code: row.code,
        label: row.label ? (decryptLabel(row.label) ?? null) : null,
        is_active: row.is_active,
        created_at: row.created_at,
      }));

      return NextResponse.json({ codes: result }, { status: 201 });
    } else {
      // Single code
      const { label } = parsed.data as z.infer<typeof CreateSingleSchema>;

      // Retry up to 5 times to get a unique code
      let code: string | null = null;
      const { generateCode } = await import("@/lib/admin/wordlist");

      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();
        const { data: existing } = await supabase
          .from("access_codes")
          .select("code")
          .eq("code", candidate)
          .maybeSingle();

        if (!existing) {
          code = candidate;
          break;
        }
      }

      if (!code) {
        return NextResponse.json(
          { error: "No se pudo generar un código único. Inténtalo de nuevo." },
          { status: 409 }
        );
      }

      const { data, error } = await supabase
        .from("access_codes")
        .insert({
          code,
          label: label ? encryptLabel(label) : null,
          is_active: true,
        })
        .select("code, label, is_active, created_at")
        .single();

      if (error) throw error;

      return NextResponse.json(
        {
          code: data.code,
          label: data.label ? (decryptLabel(data.label) ?? null) : null,
          is_active: data.is_active,
          created_at: data.created_at,
        },
        { status: 201 }
      );
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("POST /api/admin/codes error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
