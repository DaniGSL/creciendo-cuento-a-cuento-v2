"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Story, StoryGenre } from "@/types/database";
import StoryCard from "@/components/story/StoryCard";
import { GENRE_STYLES, GENRES, GENRE_KEY_MAP, getGenreStyle } from "@/lib/utils/genre";

type StoryPreview = Pick<
  Story,
  "id" | "title" | "content" | "genre" | "language" | "reading_time" | "is_favorite" | "created_at" | "saga_id" | "chapter_number"
>;

interface SagaGroup {
  sagaId: string;
  chapters: StoryPreview[]; // ordenados por capítulo
}

export default function BibliotecaPage() {
  const t = useTranslations("library");
  const tGen = useTranslations("generate");
  const [stories, setStories] = useState<StoryPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<StoryGenre | "Todos">("Todos");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStories(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      if (activeGenre !== "Todos" && s.genre !== activeGenre) return false;
      if (onlyFavorites && !s.is_favorite) return false;
      return true;
    });
  }, [stories, activeGenre, onlyFavorites]);

  // Agrupar sagas: una tarjeta por saga + cuentos sueltos
  const { sagas, standalone } = useMemo(() => {
    const bySaga = new Map<string, StoryPreview[]>();
    const standalone: StoryPreview[] = [];
    for (const s of filtered) {
      if (s.saga_id) {
        const arr = bySaga.get(s.saga_id) ?? [];
        arr.push(s);
        bySaga.set(s.saga_id, arr);
      } else {
        standalone.push(s);
      }
    }
    const sagas: SagaGroup[] = [...bySaga.entries()].map(([sagaId, chapters]) => ({
      sagaId,
      chapters: chapters.sort(
        (a, b) => (a.chapter_number ?? 0) - (b.chapter_number ?? 0)
      ),
    }));
    // Ordenar por actividad más reciente
    sagas.sort((a, b) => {
      const lastA = Math.max(...a.chapters.map((c) => new Date(c.created_at).getTime()));
      const lastB = Math.max(...b.chapters.map((c) => new Date(c.created_at).getTime()));
      return lastB - lastA;
    });
    return { sagas, standalone };
  }, [filtered]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display italic text-3xl text-primary-dark mb-1">
          {t("title")}
        </h1>
        <p className="text-text-secondary text-sm">
          {loading
            ? t("loading")
            : `${stories.length} ${t(stories.length !== 1 ? "stories_count_other" : "stories_count_one")}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Genre chips */}
        <button
          onClick={() => setActiveGenre("Todos")}
          className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
          style={{
            borderColor: activeGenre === "Todos" ? "var(--color-primary-dark)" : "var(--color-surface-low)",
            background: activeGenre === "Todos" ? "var(--color-primary-dark)" : "var(--color-surface-low)",
            color: activeGenre === "Todos" ? "white" : "var(--color-text-secondary)",
          }}
        >
          {t("filter_all")}
        </button>
        {GENRES.map((g) => {
          const style = GENRE_STYLES[g];
          const active = activeGenre === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGenre(active ? "Todos" : g)}
              className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
              style={{
                borderColor: active ? style.badge : "var(--color-surface-low)",
                background: active ? style.bg : "var(--color-surface-low)",
                color: active ? style.text : "var(--color-text-secondary)",
              }}
            >
              {style.emoji} {tGen(GENRE_KEY_MAP[g])}
            </button>
          );
        })}

        {/* Favorites toggle */}
        <button
          onClick={() => setOnlyFavorites((v) => !v)}
          className="ml-auto px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
          style={{
            borderColor: onlyFavorites ? "#F9D976" : "var(--color-surface-low)",
            background: onlyFavorites ? "#FEFCE8" : "var(--color-surface-low)",
            color: onlyFavorites ? "#713F12" : "var(--color-text-secondary)",
          }}
        >
          {t("filter_favorites")}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface-low animate-pulse h-52"
            />
          ))}
        </div>
      ) : filtered.length === 0 && stories.length === 0 ? (
        /* Empty library */
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📚</p>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t("no_stories_title")}
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            {t("no_stories_subtitle")}
          </p>
          <Link
            href="/generar"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--color-primary-dark)" }}
          >
            {t("create_btn")}
          </Link>
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <p className="text-center text-text-secondary py-10 text-sm">
              {t("no_filter")}
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sagas.map((saga) => (
              <SagaCard key={saga.sagaId} saga={saga} />
            ))}
            {standalone.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}

            {/* Create new card */}
            <Link
              href="/generar"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors min-h-[13rem]"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary-dark)",
              }}
            >
              <span className="text-3xl">+</span>
              <span className="text-sm font-medium text-center">
                {t("new_story_card")}
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Saga Card ────────────────────────────────────────────────────────────────

function SagaCard({ saga }: { saga: SagaGroup }) {
  const locale = useLocale();
  const t = useTranslations("library");
  const tGen = useTranslations("generate");

  const first = saga.chapters[0];
  const last = saga.chapters[saga.chapters.length - 1];
  const style = getGenreStyle(first.genre);
  const genreLabel = tGen(GENRE_KEY_MAP[first.genre] ?? "genre_otro");
  const anyFavorite = saga.chapters.some((c) => c.is_favorite);
  const dateStr = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(last.created_at));

  return (
    <div
      className="flex flex-col bg-surface-card rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 relative"
      style={{
        boxShadow:
          "var(--shadow-ambient), 4px 4px 0 0 rgba(125,167,240,0.18), 8px 8px 0 0 rgba(125,167,240,0.08)",
      }}
    >
      {/* Genre header */}
      <div
        className="h-20 flex items-center justify-between px-4 flex-shrink-0"
        style={{ background: style.bg }}
      >
        <span className="text-4xl">{style.emoji}</span>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: style.badge, color: style.text }}
          >
            {genreLabel.toUpperCase()}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--color-primary-dark)" }}
          >
            📚 {t("saga_label")} · {saga.chapters.length}/5
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-display italic text-base text-primary-dark leading-snug line-clamp-2">
          {first.title}
        </h3>

        {/* Chapter links */}
        <div className="flex flex-wrap gap-1.5">
          {saga.chapters.map((c) => (
            <Link
              key={c.id}
              href={`/cuento/${c.id}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform active:scale-95"
              style={{
                background: "rgba(125,167,240,0.15)",
                color: "var(--color-primary-dark)",
              }}
              title={c.title}
            >
              {c.chapter_number ?? "?"}
            </Link>
          ))}
          {saga.chapters.length < 5 && (
            <Link
              href={`/generar?continuar=${last.id}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 border-dashed transition-transform active:scale-95"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary-dark)" }}
              title={t("continue_saga")}
              aria-label={t("continue_saga")}
            >
              +
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[11px] text-text-secondary">
            {dateStr} · {saga.chapters.length}{" "}
            {t(saga.chapters.length !== 1 ? "chapters_other" : "chapters_one")}
          </span>
          {anyFavorite && <span className="text-sm">⭐</span>}
        </div>
      </div>
    </div>
  );
}
