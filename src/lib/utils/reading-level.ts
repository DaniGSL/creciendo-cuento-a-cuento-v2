import type { ReadingLevel } from "@/types/database";

export interface ReadingLevelConfig {
  wpm: number;
  cefr: string;
  label: string;
  levelInstructions: string;
}

export const READING_LEVEL_CONFIG: Record<ReadingLevel, ReadingLevelConfig> = {
  infantil: {
    wpm: 60,
    cefr: "A1",
    label: "Infantil",
    levelInstructions: `NIVEL DE LENGUAJE — Infantil (A1, 3-6 años, para leer en voz alta):
- Vocabulario muy sencillo: menos de 300 palabras únicas, palabras de uso diario.
- Frases muy cortas: máximo 6-8 palabras por frase.
- Repetición de palabras y estructuras para facilitar la comprensión.
- Narrador cálido y musical, ideal para ser leído en voz alta.
- Estructura simple: situación → pequeño problema → solución inmediata → final feliz.
- Los personajes expresan emociones básicas (alegría, miedo, sorpresa, amor).
- IMPORTANTE: aunque el vocabulario es infantil, el cuento debe ser emotivo y agradable también para los adultos que lo leen en voz alta.`,
  },
  primaria_baja: {
    wpm: 80,
    cefr: "A2",
    label: "Primaria Baja",
    levelInstructions: `NIVEL DE LENGUAJE — Primaria Baja (A2, 6-8 años):
- Vocabulario cotidiano con alguna palabra nueva explicada por contexto.
- Frases cortas a medias: 8-12 palabras, alguna coordinada sencilla (y, pero, porque).
- Narrador amigable y cercano.
- Estructura clara: presentación → problema → intento de solución → éxito → final feliz.
- Diálogos cortos y expresivos.
- IMPORTANTE: temática y tono apropiados para niños, agradable para leer en familia.`,
  },
  primaria_media: {
    wpm: 100,
    cefr: "B1",
    label: "Primaria Media",
    levelInstructions: `NIVEL DE LENGUAJE — Primaria Media (B1, 8-10 años):
- Vocabulario cotidiano con algunas palabras nuevas inferibles por contexto.
- Frases de longitud media: 10-15 palabras, con alguna subordinada sencilla.
- Narrador claro y cercano, sin recursos literarios complejos.
- Estructura: introducción → desarrollo con pequeño giro → resolución → final feliz.
- Diálogos naturales que hacen avanzar la historia.
- IMPORTANTE: temática y tono apropiados para niños, agradable para leer en familia.`,
  },
  primaria_alta: {
    wpm: 120,
    cefr: "B2",
    label: "Primaria Alta",
    levelInstructions: `NIVEL DE LENGUAJE — Primaria Alta (B2, 10-12 años):
- Vocabulario variado con términos descriptivos y algunos literarios.
- Frases más complejas con subordinadas, aunque sin exceso.
- Narrador con cierta voz propia; puede usar alguna metáfora o comparación.
- Estructura con introducción, nudo con un giro interesante y desenlace satisfactorio.
- Diálogos que revelan algo del carácter de los personajes.
- IMPORTANTE: temática y tono apropiados para niños, disfrutable también por adultos.`,
  },
  secundaria: {
    wpm: 150,
    cefr: "C1",
    label: "Secundaria",
    levelInstructions: `NIVEL DE LENGUAJE — Secundaria (C1, 12-16 años / hermanos mayores):
- Vocabulario rico, preciso e incluso técnico cuando corresponda.
- Frases complejas con múltiples cláusulas; ritmo narrativo variado.
- Narrador con voz literaria: puede usar ironía suave, metáforas y personificación.
- Estructura narrativa con introducción, nudo con varios giros y desenlace emocionalmente satisfactorio.
- Diálogos que definen la psicología de los personajes.
- IMPORTANTE: aunque el lenguaje es sofisticado, la temática y los valores son apropiados para niños y para leer en familia.`,
  },
  adulto: {
    wpm: 200,
    cefr: "C2",
    label: "Adulto / Familia",
    levelInstructions: `NIVEL DE LENGUAJE — Adulto / Familia (C2):
- Vocabulario rico y preciso: usa términos técnicos, palabras poco comunes y expresiones idiomáticas cuando enriquezcan el texto.
- Frases con subordinadas, participios absolutos y construcciones complejas.
- Narrador con voz literaria propia: puede usar ironía suave, metáforas elaboradas y recursos estilísticos como la personificación o la sinestesia.
- Estructura narrativa con introducción, nudo con varios giros y desenlace emocionalmente satisfactorio.
- Los diálogos revelan la psicología de los personajes.
- IMPORTANTE: aunque el lenguaje es adulto, la temática, los valores y el tono siguen siendo apropiados para niños y para leer en familia.`,
  },
};

/** Calcula el número de palabras objetivo según nivel y minutos deseados. */
export function readingTimeToWordCount(
  level: ReadingLevel,
  minutes: number
): number {
  return Math.round(READING_LEVEL_CONFIG[level].wpm * minutes);
}

/** Devuelve las instrucciones de nivel para el prompt de usuario. */
export function getLevelInstructions(level: ReadingLevel): string {
  return READING_LEVEL_CONFIG[level].levelInstructions;
}

/** Estima los minutos de lectura a partir del número de palabras y el nivel. */
export function wordCountToReadingTime(
  level: ReadingLevel,
  wordCount: number
): number {
  return Math.round(wordCount / READING_LEVEL_CONFIG[level].wpm);
}

/** Cuenta palabras en un string (aproximación). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
