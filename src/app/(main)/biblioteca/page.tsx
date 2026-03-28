"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Story, StoryGenre } from "@/types/database";
import StoryCard from "@/components/story/StoryCard";
import { GENRE_STYLES, GENRES } from "@/lib/utils/genre";

type StoryPreview = Pick<
  Story,
  "id" | "title" | "content" | "genre" | "language" | "reading_time" | "is_favorite" | "created_at"
>;

export default function BibliotecaPage() {
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display italic text-3xl text-primary-dark mb-1">
          Mi Biblioteca de Cuentos
        </h1>
        <p className="text-text-secondary text-sm">
          {loading
            ? "Cargando…"
            : `${stories.length} cuento${stories.length !== 1 ? "s" : ""} creado${stories.length !== 1 ? "s" : ""}`}
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
          Todos
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
              {style.emoji} {g}
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
          ⭐ Favoritos
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
            Aún no hay cuentos
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            ¡Crea tu primera historia y aparecerá aquí!
          </p>
          <Link
            href="/generar"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--color-primary-dark)" }}
          >
            ✨ Crear cuento
          </Link>
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <p className="text-center text-text-secondary py-10 text-sm">
              No hay cuentos con estos filtros.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((story) => (
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
                Crear nueva historia
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
