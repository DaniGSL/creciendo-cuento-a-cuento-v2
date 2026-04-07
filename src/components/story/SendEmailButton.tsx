"use client";

import { useState } from "react";
import type { Story } from "@/types/database";

type State = "idle" | "generating" | "sending" | "done" | "error";

interface Props {
  story: Story;
}

export default function SendEmailButton({ story }: Props) {
  const [state, setState] = useState<State>("idle");

  const handleSend = async () => {
    setState("generating");
    try {
      // 1. Generate PDF in the browser and get base64
      const { getPdfBase64 } = await import("@/lib/pdf/get-pdf-base64");
      const pdfBase64 = await getPdfBase64(story);

      // 2. Send base64 to server → server emails it via Resend
      setState("sending");
      const res = await fetch(`/api/stories/${story.id}/send-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al enviar");
      }

      setState("done");
      setTimeout(() => setState("idle"), 3500);
    } catch (e) {
      console.error("SendEmailButton:", e);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const isBusy = state === "generating" || state === "sending";

  return (
    <div>
      <button
        type="button"
        onClick={handleSend}
        disabled={isBusy || state === "done"}
        aria-label="Enviar cuento por email"
        className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
        style={{
          color:
            state === "done"
              ? "var(--color-success, #16A34A)"
              : state === "error"
              ? "var(--color-danger, #EF4444)"
              : "var(--color-text-secondary)",
        }}
      >
        {/* Icon */}
        {isBusy ? (
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
        ) : state === "done" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
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
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        )}

        {/* Label */}
        <span>
          {state === "generating"
            ? "Generando PDF…"
            : state === "sending"
            ? "Enviando…"
            : state === "done"
            ? "¡Enviado!"
            : state === "error"
            ? "Error al enviar"
            : "Enviar PDF"}
        </span>
      </button>
    </div>
  );
}
