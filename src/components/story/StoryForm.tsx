"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Story, StoryCharacter, StoryGenre, StoryLanguage, ReadingLevel } from "@/types/database";
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
  instructions: string;
}

type SagaCandidate = Pick<
  Story,
  "id" | "title" | "language" | "characters" | "reading_level" | "genre" | "saga_id" | "chapter_number" | "created_at"
>;

type GenStatus = "writing" | "reviewing" | "retrying" | "finalizing";

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

export default function StoryForm({
  continueFromId = null,
}: {
  continueFromId?: string | null;
}) {
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
    instructions: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<GenStatus>("writing");
  const [error, setError] = useState<string | null>(null);

  // ── Sagas: cuentos que se pueden continuar ──────────────────────────
  const [allStories, setAllStories] = useState<SagaCandidate[]>([]);
  const [sagaOriginId, setSagaOriginId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllStories(data);
      })
      .catch(() => {});
  }, []);

  // Elegibles: cuentos sueltos, o el ÚLTIMO capítulo de sagas con <5 capítulos
  const sagaCandidates = useMemo(() => {
    const bySaga = new Map<string, SagaCandidate[]>();
    const standalone: SagaCandidate[] = [];
    for (const s of allStories) {
      if (s.saga_id) {
        const arr = bySaga.get(s.saga_id) ?? [];
        arr.push(s);
        bySaga.set(s.saga_id, arr);
      } else {
        standalone.push(s);
      }
    }
    const result: (SagaCandidate & { sagaLength: number })[] = standalone.map(
      (s) => ({ ...s, sagaLength: 1 })
    );
    for (const chapters of bySaga.values()) {
      if (chapters.length >= 5) continue;
      const last = [...chapters].sort(
        (a, b) => (a.chapter_number ?? 0) - (b.chapter_number ?? 0)
      )[chapters.length - 1];
      result.push({ ...last, sagaLength: chapters.length });
    }
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [allStories]);

  const sagaOrigin = useMemo(
    () => sagaCandidates.find((s) => s.id === sagaOriginId) ?? null,
    [sagaCandidates, sagaOriginId]
  );

  // Preselección al llegar desde «Continuar la saga» de un cuento
  useEffect(() => {
    if (!continueFromId || allStories.length === 0) return;
    const target = allStories.find((s) => s.id === continueFromId);
    if (!target) return;
    // Si es un capítulo intermedio, continuar desde el último de su saga
    const candidate =
      sagaCandidates.find((s) => s.id === continueFromId) ??
      (target.saga_id
        ? sagaCandidates.find((s) => s.saga_id === target.saga_id)
        : null);
    if (candidate) {
      setSagaOriginId(candidate.id);
      setForm((f) => ({ ...f, genre: candidate.genre, language: candidate.language }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueFromId, allStories.length]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const canNext1 = sagaOrigin !== null || form.selectedCharacters.length > 0;
  const genreValid = form.genre !== null && (form.genre !== "Otro" || form.genreCustom.trim().length > 0);
  const locationValid = form.location !== null && (form.location !== "Otro" || form.locationCustom.trim().length > 0);
  const canNext2 = genreValid && locationValid;

  const effectiveGenre = form.genre === "Otro" ? form.genreCustom.trim() : (form.genre ?? "");
  const effectiveLocation = form.location === "Otro" ? form.locationCustom.trim() : (form.location ?? "");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenStatus("writing");
    setError(null);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters: sagaOrigin
            ? sagaOrigin.characters
            : form.selectedCharacters,
          genre: effectiveGenre,
          location: effectiveLocation,
          language: sagaOrigin ? sagaOrigin.language : form.language,
          readingLevel: form.readingLevel,
          readingTime: form.readingTime,
          ...(form.instructions.trim()
            ? { instructions: form.instructions.trim() }
            : {}),
          ...(sagaOrigin ? { continueFromStoryId: sagaOrigin.id } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const err = data.error;
        if (typeof err === "string") throw new Error(err);
        if (err && typeof err === "object") {
          const fieldErrors = err.fieldErrors
            ? Object.entries(err.fieldErrors as Record<string, string[]>)
                .map(([, msgs]) => msgs.join(", "))
                .filter(Boolean)
            : [];
          const formErrors: string[] = Array.isArray(err.formErrors) ? err.formErrors : [];
          const messages = [...formErrors, ...fieldErrors];
          throw new Error(messages.length > 0 ? messages.join("; ") : "Error validando los datos del cuento");
        }
        throw new Error("Error generando el cuento");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as {
            chunk?: string;
            status?: string;
            done?: boolean;
            id?: string;
            error?: string;
          };
          if (event.error) throw new Error(event.error);
          if (event.status === "reviewing") setGenStatus("reviewing");
          if (event.status === "retrying") setGenStatus("retrying");
          if (event.status === "finalizing") setGenStatus("finalizing");
          if (event.done && event.id) {
            router.push(`/cuento/${event.id}`);
            return;
          }
        }
      }

      throw new Error("El cuento no se completó correctamente");
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
        {/* ── Step 1: Characters (o continuación de saga) ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Saga selector */}
            {sagaCandidates.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                  📚 {t("saga_section_title")}
                </p>
                <select
                  value={sagaOriginId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSagaOriginId(id);
                    const origin = sagaCandidates.find((s) => s.id === id);
                    if (origin) {
                      setForm((f) => ({
                        ...f,
                        genre: origin.genre,
                        language: origin.language,
                      }));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border-2 text-sm bg-surface-low text-text-primary outline-none"
                  style={{ borderColor: sagaOrigin ? "var(--color-primary)" : "transparent" }}
                >
                  <option value="">{t("saga_new_story_option")}</option>
                  {sagaCandidates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t("saga_continue_prefix")} «{s.title}»
                      {s.sagaLength > 1 ? ` (${s.sagaLength}/5)` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sagaOrigin ? (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "rgba(125,167,240,0.10)" }}
              >
                <p className="text-sm font-semibold text-primary-dark">
                  📖 {t("saga_banner", {
                    chapter: sagaOrigin.sagaLength + 1,
                    title: sagaOrigin.title,
                  })}
                </p>
                <p className="text-xs text-text-secondary">
                  {t("saga_characters_inherited")}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(sagaOrigin.characters ?? []).map((c) => (
                    <span
                      key={c.id ?? c.name}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-surface-low text-text-primary"
                      title={c.description}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <CharacterManager
                selectedCharacters={form.selectedCharacters}
                onSelectionChange={(chars) =>
                  setForm((f) => ({ ...f, selectedCharacters: chars }))
                }
              />
            )}
          </div>
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
                {sagaOrigin && (
                  <span className="ml-2 normal-case font-normal">
                    {t("saga_language_locked")}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const active = form.language === lang;
                  if (sagaOrigin && !active) return null;
                  return (
                    <button
                      key={lang}
                      type="button"
                      disabled={sagaOrigin !== null}
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

            {/* Free-text plot instructions (optional) */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                ✏️ {t("instructions_label")}
              </p>
              <textarea
                value={form.instructions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instructions: e.target.value }))
                }
                placeholder={t("instructions_placeholder")}
                maxLength={600}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-transparent text-sm bg-surface-low text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-[var(--color-primary)] resize-none"
              />
              <p className="text-[11px] text-text-secondary mt-1 text-right">
                {form.instructions.length}/600
              </p>
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
              {sagaOrigin && (
                <SummaryRow
                  emoji="📚"
                  label={t("summary_saga")}
                  value={t("saga_banner", {
                    chapter: sagaOrigin.sagaLength + 1,
                    title: sagaOrigin.title,
                  })}
                />
              )}
              <SummaryRow
                emoji="👤"
                label={t("summary_characters")}
                value={(sagaOrigin
                  ? (sagaOrigin.characters ?? [])
                  : form.selectedCharacters
                )
                  .map((c) => c.name)
                  .join(", ")}
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
              {form.instructions.trim() && (
                <SummaryRow
                  emoji="✏️"
                  label={t("summary_instructions")}
                  value={form.instructions.trim().slice(0, 80)}
                />
              )}
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
                  <span className="font-medium">
                    {genStatus === "reviewing"
                      ? t("status_reviewing")
                      : genStatus === "retrying"
                        ? t("status_retrying")
                        : genStatus === "finalizing"
                          ? t("status_finalizing")
                          : t("writing")}
                  </span>
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
