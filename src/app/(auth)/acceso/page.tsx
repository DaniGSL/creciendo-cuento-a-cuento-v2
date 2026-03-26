"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AccesoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-format as user types: LUNA-GATO-AZUL-7834
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
      .toUpperCase()
      .replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, "");

    let formatted = "";
    let numCount = 0;
    let letterGroups: string[] = ["", "", ""];
    let groupIdx = 0;
    let digits = "";

    for (const char of raw) {
      if (/\d/.test(char)) {
        digits += char;
        numCount++;
        if (numCount > 4) break;
      } else if (/[A-ZÁÉÍÓÚÑ]/.test(char)) {
        if (digits.length > 0) break; // no letters after digits start
        if (letterGroups[groupIdx].length >= 10) {
          if (groupIdx < 2) groupIdx++;
          else continue;
        }
        letterGroups[groupIdx] += char;
      } else if (char === "-" || char === " ") {
        if (groupIdx < 2 && letterGroups[groupIdx].length > 0) groupIdx++;
      }
    }

    const parts = letterGroups.filter((g) => g.length > 0);
    formatted = parts.join("-");
    if (digits.length > 0) formatted += "-" + digits.slice(0, 4);

    setCode(formatted);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al acceder");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl italic text-primary-dark mb-2">
            Creciendo Cuento a Cuento
          </h1>
          <p className="text-text-secondary text-sm">
            Tu refugio de historias personalizadas
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-surface-card rounded-2xl p-8 shadow-ambient"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <div className="mb-6 text-center">
            <div className="text-4xl mb-3">📖</div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              Introduce tu código de acceso
            </h2>
            <p className="text-text-secondary text-sm">
              Tu profesional te ha proporcionado un código personal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleInput}
                placeholder="LUNA-GATO-AZUL-7834"
                className="w-full text-center text-lg font-mono tracking-widest px-4 py-3 rounded-xl bg-surface-low border border-transparent focus:outline-none focus:border-primary transition-colors placeholder:text-text-secondary/50 text-text-primary"
                style={{ borderColor: error ? "var(--color-danger)" : undefined }}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={22}
                disabled={loading}
              />
              {error && (
                <p className="mt-2 text-sm text-danger text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 10}
              className="w-full py-3 px-6 rounded-pill font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  Accediendo...
                </span>
              ) : (
                "Acceder"
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-text-secondary text-center leading-relaxed">
            ¿No tienes código? Consulta a tu profesional de referencia.
            <br />
            Tu código es personal — guárdalo en un lugar seguro.
          </p>
        </div>

        {/* Privacy note */}
        <p className="mt-4 text-xs text-text-secondary text-center">
          No recopilamos datos personales. Tu código es tu identidad.
        </p>
      </div>
    </div>
  );
}
