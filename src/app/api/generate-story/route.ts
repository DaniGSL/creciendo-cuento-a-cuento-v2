import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  getAnthropicClient,
  STORY_MODEL,
  STORY_MAX_TOKENS,
} from "@/lib/claude/client";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type SagaContext,
} from "@/lib/claude/prompts";
import { reviewStory, summarizeStory } from "@/lib/claude/reviewer";
import {
  wordCountToReadingTime,
  countWords,
} from "@/lib/utils/reading-level";
import type { StoryCharacter, StoryGenre, StoryLanguage } from "@/types/database";

export const maxDuration = 300;

const MAX_SAGA_CHAPTERS = 5;

const StoryCharacterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
});

const GenerateStorySchema = z.object({
  characters: z.array(StoryCharacterSchema).min(1).max(10),
  genre: z.string().min(1).max(100).trim(),
  location: z.string().min(1).max(200).trim().optional(),
  language: z.enum([
    "español",
    "catalán",
    "gallego",
    "inglés",
    "francés",
    "portugués",
    "holandés",
    "alemán",
    "árabe",
    "urdu",
    "ruso",
  ]),
  readingLevel: z.enum([
    "infantil",
    "primaria_baja",
    "primaria_media",
    "primaria_alta",
    "secundaria",
    "adulto",
  ]),
  readingTime: z.number().int().min(2).max(20),
  instructions: z.string().max(600).trim().optional(),
  continueFromStoryId: z.string().uuid().optional(),
});

function sseEvent(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

type SagaChapterRow = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  chapter_number: number | null;
  language: string;
  characters: StoryCharacter[];
};

export async function POST(request: NextRequest) {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = GenerateStorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { genre, location, readingLevel, readingTime, instructions } =
    parsed.data;
  let { characters, language } = parsed.data;

  const supabase = createServerClient();

  // ── Contexto de saga (si se continúa un cuento existente) ─────────────
  let sagaContext: SagaContext | undefined;
  let sagaId: string | null = null;
  let chapterNumber: number | null = null;
  let firstChapterNeedsBackfill: string | null = null;

  if (parsed.data.continueFromStoryId) {
    const { data: origin } = await supabase
      .from("stories")
      .select("id, saga_id, profile_id")
      .eq("id", parsed.data.continueFromStoryId)
      .eq("profile_id", session.profileId)
      .single();

    if (!origin) {
      return NextResponse.json(
        { error: "Cuento de origen no encontrado" },
        { status: 404 }
      );
    }

    sagaId = origin.saga_id ?? origin.id;
    // Si el cuento de origen aún no pertenece a ninguna saga, tras generar
    // el capítulo 2 se marcará como capítulo 1 de la saga nueva.
    if (!origin.saga_id) firstChapterNeedsBackfill = origin.id;

    const { data: chapterRows, error: chaptersError } = await supabase
      .from("stories")
      .select("id, title, content, summary, chapter_number, language, characters")
      .eq("profile_id", session.profileId)
      .or(`saga_id.eq.${sagaId},id.eq.${sagaId}`)
      .order("chapter_number", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (chaptersError || !chapterRows?.length) {
      return NextResponse.json(
        { error: "No se pudo cargar la saga" },
        { status: 500 }
      );
    }

    const chapters = chapterRows as SagaChapterRow[];

    if (chapters.length >= MAX_SAGA_CHAPTERS) {
      return NextResponse.json(
        { error: "Esta saga ya tiene 5 capítulos (el máximo)" },
        { status: 400 }
      );
    }

    const last = chapters[chapters.length - 1];
    chapterNumber = chapters.length + 1;

    // Coherencia: idioma y personajes se heredan siempre de la saga.
    language = last.language as StoryLanguage;
    characters = Array.isArray(last.characters) ? last.characters : characters;

    sagaContext = {
      previousSummaries: chapters.slice(0, -1).map((c, i) => ({
        chapterNumber: c.chapter_number ?? i + 1,
        title: c.title,
        summary: c.summary ?? c.content.slice(0, 400),
      })),
      lastChapter: {
        chapterNumber: last.chapter_number ?? chapters.length,
        title: last.title,
        content: last.content,
      },
      nextChapterNumber: chapterNumber,
    };
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    characters: characters as StoryCharacter[],
    genre,
    location,
    language,
    readingLevel,
    readingTime,
    instructions,
    sagaContext,
  });

  const anthropic = getAnthropicClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Genera un cuento completo por streaming y devuelve el texto.
        const generateOnce = async (): Promise<string> => {
          let fullText = "";
          const claudeStream = anthropic.messages.stream({
            model: STORY_MODEL,
            max_tokens: STORY_MAX_TOKENS,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          });
          for await (const event of claudeStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullText += event.delta.text;
              controller.enqueue(sseEvent({ chunk: event.delta.text }));
            }
          }
          return fullText;
        };

        const parseStory = (fullText: string) => {
          const lines = fullText.split("\n");
          const title = lines[0]?.trim() ?? "";
          const content = lines.slice(1).join("\n").trim();
          return { title, content };
        };

        // ── Generación + revisión de seguridad (máx. 2 intentos) ────────
        let title = "";
        let content = "";
        let approved = false;

        for (let attempt = 1; attempt <= 2; attempt++) {
          const fullText = await generateOnce();

          if (!fullText.trim()) {
            controller.enqueue(
              sseEvent({ error: "El modelo no devolvió contenido" })
            );
            controller.close();
            return;
          }

          ({ title, content } = parseStory(fullText));

          if (!title || !content) {
            controller.enqueue(
              sseEvent({ error: "Formato de respuesta inválido" })
            );
            controller.close();
            return;
          }

          controller.enqueue(sseEvent({ status: "reviewing" }));
          const review = await reviewStory({ title, content });

          if (review.apto) {
            approved = true;
            break;
          }

          console.warn(
            `Story rejected by reviewer (attempt ${attempt}):`,
            review.motivo
          );
          if (attempt === 1) {
            controller.enqueue(sseEvent({ status: "retrying" }));
          }
        }

        if (!approved) {
          controller.enqueue(
            sseEvent({
              error:
                "No hemos podido generar un cuento que cumpla nuestras normas de contenido infantil. Prueba a cambiar las indicaciones.",
            })
          );
          controller.close();
          return;
        }

        controller.enqueue(sseEvent({ status: "finalizing" }));

        // ── Resumen para sagas/biblioteca (no bloqueante si falla) ──────
        const summary = await summarizeStory({ title, content, language });

        const actualWordCount = countWords(content);
        const actualReadingTime = Math.max(
          wordCountToReadingTime(readingLevel, actualWordCount),
          1
        );

        const { data: story, error: dbError } = await supabase
          .from("stories")
          .insert({
            profile_id: session.profileId,
            title,
            content,
            genre: genre as StoryGenre,
            language,
            reading_level: readingLevel,
            reading_time: actualReadingTime,
            characters: characters as StoryCharacter[],
            saga_id: sagaId,
            chapter_number: chapterNumber,
            summary,
          })
          .select()
          .single();

        if (dbError || !story) {
          console.error("Error saving story:", dbError);
          controller.enqueue(sseEvent({ error: "Error al guardar el cuento" }));
          controller.close();
          return;
        }

        // El capítulo 1 de una saga recién iniciada se marca como tal.
        if (sagaId && firstChapterNeedsBackfill) {
          await supabase
            .from("stories")
            .update({ saga_id: sagaId, chapter_number: 1 })
            .eq("id", firstChapterNeedsBackfill)
            .eq("profile_id", session.profileId);
        }

        controller.enqueue(sseEvent({ done: true, id: story.id }));
        controller.close();
      } catch (e) {
        console.error("POST /api/generate-story stream error:", e);
        controller.enqueue(sseEvent({ error: "Error interno del servidor" }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
