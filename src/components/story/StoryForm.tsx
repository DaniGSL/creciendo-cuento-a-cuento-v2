"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryCharacter, StoryGenre, StoryLanguage, ReadingLevel } from "@/types/database";
import CharacterManager from "@/components/character/CharacterManager";
import GenreCard from "./GenreCard";
import { GENRES } from "@/lib/utils/genre";
import { READING_LEVEL_CONFIG } from "@/lib/utils/reading-level";

type Step = 1 | 2 | 3;

interface FormState {
  selectedCharacters: StoryCharacter[];
  genre: StoryGenre | null;
  language: StoryLanguage;
  readingLevel: ReadingLevel;
  readingTime: number;
}

const STEP_LABELS: Record<Step, string> = {
  1: "LOS PERSONAJES",
  2: "LA HISTORIA",
  3: "¡LISTA PARA CREAR!",
};

const LANGUAGES: StoryLanguage[] = [
  "español", "catalán", "gallego", "inglés",
  "francés", "holandés", "alemán", "árabe", "urdu",
];

const READING_LEVELS: ReadingLevel[] = [
  "infantil", "primaria_baja", "primaria_media",
  "primaria_alta", "secundaria", "adulto",
];

const TIME_OPTIONS = [5, 10, 15, 20];

export default function StoryForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    selectedCharacters: [],
    genre: null,
    language: "español",
    readingLevel: "primaria_media",
    readingTime: 10,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const canNext1 = form.selectedCharacters.length > 0;
  const canNext2 = form.genre !== null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters: form.selectedCharacters,
          genre: form.genre,
          language: form.language,
          readingLevel: form.readingLevel,
          readingTime: form.readingTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando el cuento");
      router.push(`/cuento/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-text-secondary mb-2">
          <span>PASO {step} DE 3: {STEP_LABELS[step]}</span>
          <span>{progress}% Completado</span>
        </div>
        <div className="h-2 bg-surface-low rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="bg-surface-card rounded-2xl p-6"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        {/* ── Step 1: Characters ── */}
        {step === 1 && (
          <CharacterManager
            selectedCharacters={form.selectedCharacters}
            onSelectionChange={(chars) =>
              setForm((f) => ({ ...f, selectedCharacters: chars }))
            }
          />
        )}

        {/* ── Step 2: Story settings ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                ¿Cómo será la historia?
              </h2>
              <p className="text-sm text-text-secondary">
                Personaliza el estilo y la complejidad del cuento.
              </p>
            </div>

            {/* Genre */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                Género literario
              </p>
              <div className="grid grid-cols-4 gap-2">
                {GENRES.map((g) => (
                  <GenreCard
                    key={g}
                    genre={g}
                    selected={form.genre === g}
                    onClick={() => setForm((f) => ({ ...f, genre: g }))}
                  />
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                Idioma del cuento
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const active = form.language === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, language: lang }))}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all capitalize"
                      style={{
                        borderColor: active ? "var(--color-primary-dark)" : "var(--color-surface-low)",
                        background: active ? "var(--color-primary-dark)" : "var(--color-surface-low)",
                        color: active ? "white" : "var(--color-text-secondary)",
                      }}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading level */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                Nivel de lectura
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {READING_LEVELS.map((level) => {
                  const config = READING_LEVEL_CONFIG[level];
                  const active = form.readingLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, readingLevel: level }))}
                      className="px-3 py-2 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: active ? "var(--color-primary)" : "var(--color-surface-low)",
                        background: active ? "var(--color-primary)/10" : "var(--color-surface-low)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: active ? "var(--color-primary-dark)" : "var(--color-text-primary)" }}
                      >
                        {config.label}
                      </p>
                      <p className="text-xs text-text-secondary">{config.cefr}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading time */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                Duración del cuento
              </p>
              <div className="flex gap-2">
                {TIME_OPTIONS.map((t) => {
                  const active = form.readingTime === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, readingTime: t }))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        borderColor: active ? "var(--color-primary-dark)" : "var(--color-surface-low)",
                        background: active ? "var(--color-primary-dark)" : "var(--color-surface-low)",
                        color: active ? "white" : "var(--color-text-secondary)",
                      }}
                    >
                      {t} min
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm & Generate ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">
                ¡Todo listo!
              </h2>
              <p className="text-sm text-text-secondary">
                Así será tu cuento personalizado:
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-surface-low p-4 space-y-3">
              <SummaryRow
                emoji="👤"
                label="Personajes"
                value={form.selectedCharacters.map((c) => c.name).join(", ")}
              />
              <SummaryRow emoji="📖" label="Género" value={form.genre ?? ""} />
              <SummaryRow emoji="🌍" label="Idioma" value={form.language} />
              <SummaryRow
                emoji="🎓"
                label="Nivel"
                value={`${READING_LEVEL_CONFIG[form.readingLevel].label} (${READING_LEVEL_CONFIG[form.readingLevel].cefr})`}
              />
              <SummaryRow
                emoji="⏱️"
                label="Duración"
                value={`~${form.readingTime} minutos`}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-danger text-center bg-red-50 rounded-lg p-3">
                {error}
              </p>
            )}

            {/* Generate button */}
            {isGenerating ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-3 text-text-secondary">
                  <svg
                    className="animate-spin h-5 w-5"
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
                  <span className="font-medium">Escribiendo tu cuento...</span>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Esto puede tardar entre 10 y 30 segundos.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-4 rounded-2xl text-base font-bold text-white transition-transform active:scale-[0.98] shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                  boxShadow: "0 8px 24px rgba(125, 167, 240, 0.4)",
                }}
              >
                ✨ Generar Cuento
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            disabled={isGenerating}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary bg-surface-low hover:bg-surface-card transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 1 ? !canNext1 : !canNext2}
            className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "var(--color-primary-dark)" }}
          >
            Siguiente
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center">{emoji}</span>
      <span className="text-sm text-text-secondary w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-text-primary capitalize">{value}</span>
    </div>
  );
}
