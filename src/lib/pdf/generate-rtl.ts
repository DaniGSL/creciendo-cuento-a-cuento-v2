/**
 * generate-rtl.ts — PDF generation for RTL languages (Arabic, Urdu) via
 * html2canvas + jsPDF. Renders a hidden styled DOM node and captures it as an
 * image so that the browser handles complex RTL shaping automatically.
 *
 * Called ONLY from client components (browser environment).
 */

import type { Story } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escapes HTML special chars to prevent injection from story content. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateRtlPdf(story: Story): Promise<void> {
  // ── Build HTML content ────────────────────────────────────────────────────
  const paragraphsHtml = story.content
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="font-size:13px;line-height:2;margin:0 0 14px 0;">${escHtml(p.trim()).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  // ── Create hidden container ───────────────────────────────────────────────
  // 794 px = A4 width at 96 dpi
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    top: "-10000px",
    left: "-10000px",
    width: "794px",
    background: "#ffffff",
    fontFamily: "'Tahoma', 'Arial', 'Helvetica', sans-serif",
    direction: "rtl",
    textAlign: "right",
    padding: "60px 50px",
    boxSizing: "border-box",
    color: "#1F2937",
  });

  container.innerHTML = `
    <h1 style="font-size:24px;font-weight:bold;color:#2d5b9f;line-height:1.4;margin:0 0 20px 0;">
      ${escHtml(story.title)}
    </h1>
    <div style="border-top:1px solid #E5E7EB;margin:0 0 20px 0;"></div>
    ${paragraphsHtml}
    <p style="font-size:9px;color:#9CA3AF;text-align:center;margin-top:40px;font-style:italic;">
      Generado con Creciendo Cuento a Cuento
    </p>
  `;

  document.body.appendChild(container);

  try {
    // ── Render to canvas ───────────────────────────────────────────────────
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // ── Convert to PDF ─────────────────────────────────────────────────────
    const { jsPDF } = await import("jspdf");

    const PAGE_WIDTH_MM = 210;
    const PAGE_HEIGHT_MM = 297;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidthMm = PAGE_WIDTH_MM;
    const pxPerMm = canvas.width / imgWidthMm;
    const pageHeightPx = PAGE_HEIGHT_MM * pxPerMm;
    const totalHeightMm = canvas.height / pxPerMm;

    if (totalHeightMm <= PAGE_HEIGHT_MM) {
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        0,
        0,
        imgWidthMm,
        totalHeightMm
      );
    } else {
      let offsetY = 0;
      let firstPage = true;

      while (offsetY < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = Math.round(sliceHeightPx);

        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        if (!firstPage) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0,
          0,
          imgWidthMm,
          sliceHeightPx / pxPerMm
        );

        offsetY += pageHeightPx;
        firstPage = false;
      }
    }

    const filename = `${story.title.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
    pdf.save(filename);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
