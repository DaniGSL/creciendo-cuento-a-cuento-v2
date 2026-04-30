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

const StoryCharacterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
});

const GenerateStorySchema = z.object({
  characters: z.array(StoryCharacterSchema).min(1).max(5),
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = GenerateStorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { characters, genre, location, language, readingLevel, readingTime } =
      parsed.data;

    // Construir prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      characters: characters as StoryCharacter[],
      genre,
      location,
      language,
      readingLevel,
      readingTime,
    });

    // Llamar a Claude
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: STORY_MODEL,
      max_tokens: STORY_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "El modelo no devolvió contenido" },
        { status: 502 }
      );
    }

    // Parsear: primera línea = título, resto = contenido
    const lines = rawText.split("\n");
    const title = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Formato de respuesta inválido" },
        { status: 502 }
      );
    }

    // Calcular tiempo de lectura real según palabras generadas
    const actualWordCount = countWords(content);
    const actualReadingTime = Math.max(
      wordCountToReadingTime(readingLevel, actualWordCount),
      1
    );

    // Guardar en base de datos
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
      return NextResponse.json(
        { error: "Error al guardar el cuento" },
        { status: 500 }
      );
    }

    return NextResponse.json(story, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("POST /api/generate-story error:", e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
