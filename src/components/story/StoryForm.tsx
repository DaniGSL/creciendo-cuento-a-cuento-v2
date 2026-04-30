"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { StoryCharacter, StoryGenre, StoryLanguage, ReadingLevel } from "@/types/database";
import CharacterManager from "@/components/character/CharacterManager";
import GenreCard from "./GenreCard";
import { GENRES, GENRE_KEY_MAP } from "@/lib/utils/genre";
import { LOCATIONS } from "@/lib/utils/location";
import { READING_LEVEL_CONFIG, READING_LEVEL_KEY_MAP } from "@/lib/utils/reading-level";

type Step = 1 | 2 | 3;

interface FormState {
  selectedCharacters: StoryCharacter[];
  genre: StoryGenre | null;
  genreCustom: string;
  location: string | null;
  locationCustom: string;
  language: StoryLanguage;
  readingLevel: ReadingLevel;
  readingTime: number;
}

const LANGUAGES: StoryLanguage[] = [
  "español", "catalán", "gallego", "inglés",
  "francés", "portugués", "holandés", "alemán", "árabe", "urdu", "ruso",
];

const LANGUAGE_KEY_MAP: Record<StoryLanguage, string> = {
  "español":   "lang_espanol",
  "catalán":   "lang_catalan",
  "gallego":   "lang_gallego",
  "inglés":    "lang_ingles",
  "francés":   "lang_frances",
  "portugués": "lang_portugues",
  "holandés":  "lang_holandes",
  "alemán":    "lang_aleman",
  "árabe":     "lang_arabe",
  "urdu":      "lang_urdu",
  "ruso":      "lang_ruso",
};

const READING_LEVELS: ReadingLevel[] = [
  "infantil", "primaria_baja", "primaria_media",
  "primaria_alta", "secundaria", "adulto",
];

const LEVEL_KEY_MAP = READING_LEVEL_KEY_MAP;

const TIME_OPTIONS = [5, 10, 15, 20];

export default function StoryForm() {
  const router = useRouter();
  const t = useTranslations("generate");
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    selectedCharacters: [],
    genre: null,
    genreCustom: "",
    location: null,
    locationCustom: "",
    language: "español",
    readingLevel: "primaria_media",
    readingTime: 10,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const canNext1 = form.selectedCharacters.length > 0;
  const genreValid = form.genre !== null && (form.genre !== "Otro" || form.genreCustom.trim().length > 0);
  const locationValid = form.location !== null && (form.location !== "Otro" || form.locationCustom.trim().length > 0);
  const canNext2 = genreValid && locationValid;

  const effectiveGenre = form.genre === "Otro" ? form.genreCustom.trim() : (form.genre ?? "");
  const effectiveLocation = form.location === "Otro" ? form.locationCustom.trim() : (form.location ?? "");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters: form.selectedCharacters,
          genre: effectiveGenre,
          location: effectiveLocation,
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
          <span>{t("step_indicator", { step })} {step === 1 ? t("step_1_label") : step === 2 ? t("step_2_label") : t("step_3_label")}</span>
          <span>{progress}{t("completed")}</span>
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
                {t("how_title")}
              </h2>
              <p className="text-sm text-text-secondary">
                {t("how_subtitle")}
              </p>
            </div>

            {/* Genre */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                {t("genre_label")}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {GENRES.map((g) => (
                  <GenreCard
                    key={g}
                    genre={g}
                    label={t(GENRE_KEY_MAP[g])}
                    selected={form.genre === g}
                    onClick={() => setForm((f) => ({ ...f, genre: g, genreCustom: "" }))}
                  />
                ))}
              </div>
              {form.genre === "Otro" && (
                <input
                  type="text"
                  value={form.genreCustom}
                  onChange={(e) => setForm((f) => ({ ...f, genreCustom: e.target.value }))}
                  placeholder={t("genre_other_placeholder")}
                  maxLength={80}
                  className="mt-3 w-full px-4 py-2.5 rounded-xl border-2 text-sm bg-surface-low text-text-primary placeholder:text-text-secondary outline-none transition-colors"
                  style={{ borderColor: "var(--color-primary)" }}
                />
              )}
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                {t("location_label")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LOCATIONS.map((loc) => {
                  const active = form.location === loc.value;
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, location: loc.value, locationCustom: "" }))}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-sm font-medium"
                      style={{
                        borderColor: active ? "var(--color-primary-dark)" : "transparent",
                        background: active ? "var(--color-primary)/10" : "var(--color-surface-low)",
                        color: active ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
                      }}
                    >
                      <span className="text-2xl leading-none">{loc.emoji}</span>
                      <span className="text-center leading-tight text-xs">{t(loc.key)}</span>
                    </button>
                  );
                })}
              </div>
              {form.location === "Otro" && (
                <input
                  type="text"
                  value={form.locationCustom}
                  onChange={(e) => setForm((f) => ({ ...f, locationCustom: e.target.value }))}
                  placeholder={t("location_other_placeholder")}
                  maxLength={100}
                  className="mt-3 w-full px-4 py-2.5 rounded-xl border-2 text-sm bg-surface-low text-text-primary placeholder:text-text-secondary outline-none transition-colors"
                  style={{ borderColor: "var(--color-primary)" }}
                />
              )}
            </div>

            {/* Language */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                {t("language_label")}
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
                      {t(LANGUAGE_KEY_MAP[lang])}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading level */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                {t("level_label")}
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
                        {t(LEVEL_KEY_MAP[level])}
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
                {t("duration_label")}
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
                {t("ready_title")}
              </h2>
              <p className="text-sm text-text-secondary">
                {t("ready_subtitle")}
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-surface-low p-4 space-y-3">
              <SummaryRow
                emoji="👤"
                label={t("summary_characters")}
                value={form.selectedCharacters.map((c) => c.name).join(", ")}
              />
              <SummaryRow
                emoji="📖"
                label={t("summary_genre")}
                value={form.genre === "Otro" ? form.genreCustom.trim() : form.genre ? t(GENRE_KEY_MAP[form.genre]) : ""}
              />
              <SummaryRow
                emoji="📍"
                label={t("summary_location")}
                value={form.location === "Otro" ? form.locationCustom.trim() : form.location ? t(LOCATIONS.find(l => l.value === form.location)!.key) : ""}
              />
              <SummaryRow emoji="🌍" label={t("summary_language")} value={t(LANGUAGE_KEY_MAP[form.language])} />
              <SummaryRow
                emoji="🎓"
                label={t("summary_level")}
                value={`${t(LEVEL_KEY_MAP[form.readingLevel])} (${READING_LEVEL_CONFIG[form.readingLevel].cefr})`}
              />
              <SummaryRow
                emoji="⏱️"
                label={t("summary_duration")}
                value={`~${form.readingTime} ${t("minutes")}`}
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
                  <span className="font-medium">{t("writing")}</span>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {t("writing_wait")}
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
                {t("generate_btn")}
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
            {t("prev_btn")}
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
            {t("next_btn")}
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
