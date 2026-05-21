import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  getAnthropicClient,
  STORY_MODEL,
  STORY_MAX_TOKENS,
} from "@/lib/claude/client";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/claude/prompts";
import {
  wordCountToReadingTime,
  countWords,
} from "@/lib/utils/reading-level";
import type { StoryCharacter, StoryGenre } from "@/types/database";

export const maxDuration = 300;

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
});

function sseEvent(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

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

  const { characters, genre, location, language, readingLevel, readingTime } =
    parsed.data;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    characters: characters as StoryCharacter[],
    genre,
    location,
    language,
    readingLevel,
    readingTime,
  });

  const anthropic = getAnthropicClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
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

        if (!fullText.trim()) {
          controller.enqueue(
            sseEvent({ error: "El modelo no devolvió contenido" })
          );
          controller.close();
          return;
        }

        const lines = fullText.split("\n");
        const title = lines[0].trim();
        const content = lines.slice(1).join("\n").trim();

        if (!title || !content) {
          controller.enqueue(
            sseEvent({ error: "Formato de respuesta inválido" })
          );
          controller.close();
          return;
        }

        const actualWordCount = countWords(content);
        const actualReadingTime = Math.max(
          wordCountToReadingTime(readingLevel, actualWordCount),
          1
        );

        const supabase = createServerClient();
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
          })
          .select()
          .single();

        if (dbError || !story) {
          console.error("Error saving story:", dbError);
          controller.enqueue(sseEvent({ error: "Error al guardar el cuento" }));
          controller.close();
          return;
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
