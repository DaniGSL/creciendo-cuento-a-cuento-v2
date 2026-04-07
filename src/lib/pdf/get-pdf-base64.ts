/**
 * get-pdf-base64.ts — Generates a story PDF in the browser and returns it
 * as a raw base64 string (without the data URI prefix).
 * Used by SendEmailButton to upload the PDF to the server for emailing.
 * Called ONLY from client components (browser environment).
 */

import type { Story } from "@/types/database";

export async function getPdfBase64(story: Story): Promise<string> {
  const isRtl = ["árabe", "urdu"].includes(story.language);

  if (isRtl) {
    const { getRtlPdfBase64 } = await import("@/lib/pdf/generate-rtl");
    return getRtlPdfBase64(story);
  }

  const { getLtrPdfBase64 } = await import("@/lib/pdf/generate-ltr");
  return getLtrPdfBase64(story);
}
