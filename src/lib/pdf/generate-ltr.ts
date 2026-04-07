/**
 * generate-ltr.ts — PDF generation for LTR languages via pdfmake.
 * Called ONLY from client components (browser environment).
 */

import type { Story } from "@/types/database";

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

// ─── Shared setup ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function _initPdfMake(): Promise<any> {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
  const pdfFonts = await import("pdfmake/build/vfs_fonts");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsData = (pdfFonts as any).default ?? pdfFonts;
  pdfMake.addVirtualFileSystem(vfsData);
  return pdfMake;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _buildDocDefinition(story: Story): any {
  const dateFormatted = formatDateEs(story.created_at);
  const paragraphs = buildParagraphs(story.content);

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

  return {
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
      { text: story.title, fontSize: 26, bold: true, color: "#2d5b9f", lineHeight: 1.3, margin: [0, 0, 0, 20] },
      { ...separator, margin: [0, 0, 0, 20] },
      ...paragraphs,
      { text: "Generado con Creciendo Cuento a Cuento", fontSize: 8, color: "#9CA3AF", italics: true, alignment: "center", margin: [0, 36, 0, 0] },
    ],

    defaultStyle: {
      font: "Roboto",
    },
  };
}

// ─── Public exports ───────────────────────────────────────────────────────────

/** Downloads the PDF directly in the browser. */
export async function generateLtrPdf(story: Story): Promise<void> {
  const pdfMake = await _initPdfMake();
  const doc = pdfMake.createPdf(_buildDocDefinition(story));
  const filename = `${story.title.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
  doc.download(filename);
}

/** Returns the PDF as a base64 string (no download). */
export async function getLtrPdfBase64(story: Story): Promise<string> {
  const pdfMake = await _initPdfMake();
  const doc = pdfMake.createPdf(_buildDocDefinition(story));
  // pdfmake v0.3.x: getBase64() is async and returns a Promise directly
  return doc.getBase64();
}
