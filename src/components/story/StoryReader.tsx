"use client";

import { useState } from "react";
import Link from "next/link";
import type { Story } from "@/types/database";
import { getGenreStyle } from "@/lib/utils/genre";
import { READING_LEVEL_CONFIG } from "@/lib/utils/reading-level";
import DownloadPDFButton from "@/components/story/DownloadPDFButton";

interface StoryReaderProps {
  story: Story;
}

export default function StoryReader({ story }: StoryReaderProps) {
  const [isFavorite, setIsFavorite] = useState(story.is_favorite);
  const [rating, setRating] = useState<number | null>(story.rating);
  const [savingFav, setSavingFav] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  const genreStyle = getGenreStyle(story.genre);
  const levelLabel = READING_LEVEL_CONFIG[story.reading_level].label;
  const levelCefr = READING_LEVEL_CONFIG[story.reading_level].cefr;

  const isRtl = ["árabe", "urdu"].includes(story.language);

  const toggleFavorite = async () => {
    setSavingFav(true);
    const next = !isFavorite;
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: next }),
      });
      if (res.ok) setIsFavorite(next);
    } finally {
      setSavingFav(false);
    }
  };

  const handleRating = async (star: number) => {
    if (savingRating) return;
    const next = rating === star ? null : star;
    setSavingRating(true);
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: next }),
      });
      if (res.ok) setRating(next);
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a mis cuentos
      </Link>

      {/* Card */}
      <article
        className="bg-surface-card rounded-2xl overflow-hidden"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        {/* Header band */}
        <div
          className="px-6 py-4 flex flex-wrap items-center gap-3"
          style={{ background: genreStyle.bg }}
        >
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: genreStyle.badge, color: genreStyle.text }}
          >
            {story.genre.toUpperCase()}
          </span>
          <span className="text-xs text-text-secondary">{story.language}</span>
          <span className="text-xs text-text-secondary">·</span>
          <span className="text-xs text-text-secondary">{story.reading_time} min</span>
          <span className="text-xs text-text-secondary">·</span>
          <span className="text-xs text-text-secondary">
            {levelLabel} ({levelCefr})
          </span>
        </div>

        {/* Title */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="font-display italic text-2xl md:text-3xl text-primary-dark leading-snug">
            {story.title}
          </h1>
        </div>

        {/* Actions */}
        <div className="px-6 pb-4 flex items-center gap-4 flex-wrap">
          {/* Favorite */}
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={savingFav}
            className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
            style={{ color: isFavorite ? "#F24949" : "var(--color-text-secondary)" }}
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {isFavorite ? "Favorito" : "Añadir a favoritos"}
          </button>

          {/* Download PDF */}
          <DownloadPDFButton story={story} />

          {/* Rating */}
          <div className="flex items-center gap-1 ml-auto">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRating(star)}
                disabled={savingRating}
                className="transition-transform active:scale-110 disabled:opacity-50"
                aria-label={`Valorar con ${star} estrella${star > 1 ? "s" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={rating !== null && star <= rating ? "#F9D976" : "none"}
                  stroke={rating !== null && star <= rating ? "#D97706" : "var(--color-text-secondary)"}
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-black/5 mx-6" />

        {/* Story content */}
        <div
          className="px-6 py-6"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div
            className="font-display text-base md:text-lg leading-relaxed text-text-primary whitespace-pre-wrap"
            style={{ lineHeight: "1.85" }}
          >
            {story.content}
          </div>
        </div>

        {/* Characters used */}
        {story.characters.length > 0 && (
          <div className="px-6 pb-6">
            <hr className="border-black/5 mb-4" />
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
              Personajes del cuento
            </p>
            <div className="flex flex-wrap gap-2">
              {story.characters.map((char) => (
                <span
                  key={char.id}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: genreStyle.bg,
                    color: "var(--color-text-primary)",
                  }}
                  title={char.description}
                >
                  {char.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* CTA — create another */}
      <div className="text-center mt-8">
        <Link
          href="/generar"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          }}
        >
          ✨ Crear otro cuento
        </Link>
      </div>
    </div>
  );
}
