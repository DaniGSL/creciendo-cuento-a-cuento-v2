"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Story } from "@/types/database";

interface Props {
  story: Story;
}

export default function DownloadPDFButton({ story }: Props) {
  const t = useTranslations("story");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRtl = ["árabe", "urdu"].includes(story.language);

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      if (isRtl) {
        const { generateRtlPdf } = await import("@/lib/pdf/generate-rtl");
        await generateRtlPdf(story);
      } else {
        const { generateLtrPdf } = await import("@/lib/pdf/generate-ltr");
        await generateLtrPdf(story);
      }
    } catch (e) {
      console.error("PDF generation error:", e);
      setError(t("pdf_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        aria-label={t("download_pdf_aria")}
        className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            {t("generating_pdf")}
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {t("download_pdf")}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--color-danger, #EF4444)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
