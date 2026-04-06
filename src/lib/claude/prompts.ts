import type {
  StoryCharacter,
  StoryLanguage,
  ReadingLevel,
} from "@/types/database";
import {
  readingTimeToWordCount,
  getLevelInstructions,
} from "@/lib/utils/reading-level";

export function buildSystemPrompt(): string {
  return `Eres un escritor experto en literatura infantil. Tu tarea exclusiva es generar cuentos infantiles creativos, seguros y apropiados para niños.

REGLAS ABSOLUTAS:
- NUNCA: violencia, lenguaje inapropiado, contenido sexual, horror, discriminación de ningún tipo.
- SIEMPRE: final feliz o esperanzador.
- NUNCA: texto fuera del cuento (sin "Aquí tienes tu cuento:", sin "Espero que te guste", sin comentarios al margen).
- La PRIMERA línea es el título del cuento. Línea en blanco. El cuento empieza en la tercera línea.`;
}

export interface BuildUserPromptParams {
  characters: StoryCharacter[];
  genre: string;
  location?: string;
  language: StoryLanguage;
  readingLevel: ReadingLevel;
  readingTime: number; // minutos
}

const RTL_LANGUAGES: StoryLanguage[] = ["árabe", "urdu"];

export function buildUserPrompt({
  characters,
  genre,
  location,
  language,
  readingLevel,
  readingTime,
}: BuildUserPromptParams): string {
  const wordCount = readingTimeToWordCount(readingLevel, readingTime);
  const levelInstructions = getLevelInstructions(readingLevel);
  const isRtl = RTL_LANGUAGES.includes(language);

  const charactersText = characters
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  const rtlNote = isRtl
    ? `\nDIRECCIÓN DEL TEXTO: Este idioma se escribe de derecha a izquierda. Escribe el cuento íntegramente en ${language}, respetando la dirección natural del texto.`
    : "";

  const locationLine = location ? `\nLUGAR: ${location}` : "";

  return `Escribe un cuento con las siguientes características:

PERSONAJES:
${charactersText}

GÉNERO: ${genre}${locationLine}

IDIOMA: ${language}${rtlNote}

LONGITUD: Aproximadamente ${wordCount} palabras (${readingTime} minutos de lectura).

${levelInstructions}`;
}
