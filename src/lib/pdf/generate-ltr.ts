/**
 * generate-ltr.ts — PDF generation for LTR languages via pdfmake.
 * Called ONLY from client components (browser environment).
 */

import type { Story, StoryGenre } from "@/types/database";
import type { ReadingLevel } from "@/types/database";

// ─── Colour palette per genre ────────────────────────────────────────────────

interface GenreColors {
  accent: string;
  textOnAccent: string;
}

const GENRE_COLORS: Record<StoryGenre, GenreColors> = {
  Aventura:           { accent: "#7DA7F0", textOnAccent: "#1E3A5F" },
  Fantasía:           { accent: "#C4B5FD", textOnAccent: "#4C1D95" },
  Animales:           { accent: "#98D8AA", textOnAccent: "#065F46" },
  Espacio:            { accent: "#1E3A5F", textOnAccent: "#FFFFFF" },
  Naturaleza:         { accent: "#86EFAC", textOnAccent: "#14532D" },
  "Cuento de Cuna":   { accent: "#FDE68A", textOnAccent: "#92400E" },
  Amistad:            { accent: "#F9D976", textOnAccent: "#713F12" },
  Misterio:           { accent: "#6B7280", textOnAccent: "#FFFFFF" },
};

// ─── Level labels ─────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<ReadingLevel, string> = {
  infantil:       "Infantil",
  primaria_baja:  "Primaria Baja",
  primaria_media: "Primaria Media",
  primaria_alta:  "Primaria Alta",
  secundaria:     "Secundaria",
  adulto:         "Adulto / Familia",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateEs(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

/** Splits story content into paragraph text blocks. */
function buildParagraphs(content: string): object[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((para) => ({
      text: para,
      fontSize: 12,
      lineHeight: 1.75,
      color: "#1F2937",
      margin: [0, 0, 0, 14],
    }));
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateLtrPdf(story: Story): Promise<void> {
  // Dynamic imports — runs only in the browser
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;

  const pdfFonts = await import("pdfmake/build/vfs_fonts");
  // In pdfmake v0.3.x, vfs_fonts exports a flat { 'Font.ttf': base64, ... } object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsData = (pdfFonts as any).default ?? pdfFonts;
  pdfMake.addVirtualFileSystem(vfsData);

  const colors = GENRE_COLORS[story.genre];
  const levelLabel = LEVEL_LABELS[story.reading_level];
  const dateFormatted = formatDateEs(story.created_at);
  const paragraphs = buildParagraphs(story.content);

  // ── Separator line helper ──────────────────────────────────────────────────
  const separator = {
    canvas: [
      {
        type: "line",
        x1: 0, y1: 0, x2: 495, y2: 0,
        lineWidth: 0.75,
        lineColor: "#E5E7EB",
      },
    ],
  };

  // ── Characters section ────────────────────────────────────────────────────
  const charactersSection: object[] =
    story.characters.length > 0
      ? [
          { ...separator, margin: [0, 24, 0, 16] },
          {
            text: "PERSONAJES DEL CUENTO",
            fontSize: 8,
            bold: true,
            color: "#9CA3AF",
            characterSpacing: 1.2,
            margin: [0, 0, 0, 10],
          },
          ...story.characters.map((char) => ({
            text: [
              { text: char.name + ":  ", bold: true, color: "#374151" },
              { text: char.description, color: "#6B7280" },
            ],
            fontSize: 10,
            lineHeight: 1.5,
            margin: [0, 0, 0, 6],
          })),
        ]
      : [];

  // ── Document definition ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [50, 60, 50, 70],

    header: () => ({
      columns: [
        {
          text: "Creciendo Cuento a Cuento",
          fontSize: 8,
          color: "#9CA3AF",
          margin: [50, 20, 0, 0],
        },
        {
          text: dateFormatted,
          fontSize: 8,
          color: "#9CA3AF",
          alignment: "right",
          margin: [0, 20, 50, 0],
        },
      ],
    }),

    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#9CA3AF",
      margin: [0, 10, 0, 0],
    }),

    content: [
      // Genre + metadata header band
      {
        table: {
          widths: ["auto", "*"],
          body: [
            [
              {
                text: story.genre.toUpperCase(),
                fontSize: 9,
                bold: true,
                color: colors.textOnAccent,
                fillColor: colors.accent,
                border: [false, false, false, false],
                margin: [12, 10, 16, 10],
              },
              {
                text: `${story.language}  ·  ${story.reading_time} min  ·  ${levelLabel}`,
                fontSize: 9,
                color: colors.textOnAccent,
                alignment: "right",
                fillColor: colors.accent,
                border: [false, false, false, false],
                margin: [0, 10, 12, 10],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 24],
      },

      // Title
      {
        text: story.title,
        fontSize: 26,
        bold: true,
        color: "#2d5b9f",
        lineHeight: 1.3,
        margin: [0, 0, 0, 20],
      },

      // Separator
      { ...separator, margin: [0, 0, 0, 20] },

      // Story content
      ...paragraphs,

      // Characters
      ...charactersSection,

      // Branding note
      {
        text: "Generado con Creciendo Cuento a Cuento",
        fontSize: 8,
        color: "#9CA3AF",
        italics: true,
        alignment: "center",
        margin: [0, 36, 0, 0],
      },
    ],

    defaultStyle: {
      font: "Roboto",
    },
  };

  const doc = pdfMake.createPdf(docDefinition);
  // Sanitize filename
  const filename = `${story.title.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
  doc.download(filename);
}
