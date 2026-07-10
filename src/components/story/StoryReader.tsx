"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Story, StoryLanguage } from "@/types/database";
import { getGenreStyle, GENRE_KEY_MAP } from "@/lib/utils/genre";
import { READING_LEVEL_KEY_MAP } from "@/lib/utils/reading-level";
import DownloadPDFButton from "@/components/story/DownloadPDFButton";
import SendEmailButton from "@/components/story/SendEmailButton";

const STORY_LANGUAGE_KEY_MAP: Record<StoryLanguage, string> = {
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

interface StoryReaderProps {
  story: Story;
  sagaLength: number;
  isLastChapter: boolean;
}

export default function StoryReader({
  story,
  sagaLength,
  isLastChapter,
}: StoryReaderProps) {
  const router = useRouter();
  const tStory = useTranslations("story");
  const tGen = useTranslations("generate");

  const [isFavorite, setIsFavorite] = useState(story.is_favorite);
  const [rating, setRating] = useState<number | null>(story.rating);
  const [savingFav, setSavingFav] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  // ── Invitación a valorar antes de salir ─────────────────────────────
  const [showRateModal, setShowRateModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [rateDismissed, setRateDismissed] = useState(false);
  const [modalRating, setModalRating] = useState<number | null>(null);
  const [modalFeedback, setModalFeedback] = useState("");
  const [sendingModal, setSendingModal] = useState(false);

  const canContinueSaga =
    story.saga_id === null || (isLastChapter && sagaLength < 5);

  const interceptLeave = (e: React.MouseEvent, href: string) => {
    if (rating !== null || rateDismissed) return; // ya valorado o descartado
    e.preventDefault();
    setPendingHref(href);
    setShowRateModal(true);
  };

  const closeModalAndLeave = () => {
    setShowRateModal(false);
    setRateDismissed(true);
    if (pendingHref) router.push(pendingHref);
  };

  const submitModalRating = async () => {
    if (modalRating === null) {
      closeModalAndLeave();
      return;
    }
    setSendingModal(true);
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: modalRating,
          ...(modalFeedback.trim() ? { feedback: modalFeedback.trim() } : {}),
        }),
      });
      setRating(modalRating);
    } catch {
      // no bloquear la salida por un fallo de red
    } finally {
      setSendingModal(false);
      closeModalAndLeave();
    }
  };

  const genreStyle = getGenreStyle(story.genre);
  const genreLabel = tGen(GENRE_KEY_MAP[story.genre] ?? "genre_otro");
  const levelLabel = tGen(READING_LEVEL_KEY_MAP[story.reading_level]);
  const levelCefr = story.reading_level === "infantil" ? "A1"
    : story.reading_level === "primaria_baja" ? "A2"
    : story.reading_level === "primaria_media" ? "B1"
    : story.reading_level === "primaria_alta" ? "B2"
    : story.reading_level === "secundaria" ? "C1"
    : "C2";
  const languageLabel = tGen(STORY_LANGUAGE_KEY_MAP[story.language as StoryLanguage] ?? "lang_espanol");

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
        onClick={(e) => interceptLeave(e, "/biblioteca")}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        {tStory("back")}
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
            {genreLabel.toUpperCase()}
          </span>
          <span className="text-xs text-text-secondary">{languageLabel}</span>
          <span className="text-xs text-text-secondary">·</span>
          <span className="text-xs text-text-secondary">{story.reading_time} min</span>
          <span className="text-xs text-text-secondary">·</span>
          <span className="text-xs text-text-secondary">
            {levelLabel} ({levelCefr})
          </span>
          {story.chapter_number !== null && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full ml-auto"
              style={{ background: "rgba(125,167,240,0.18)", color: "var(--color-primary-dark)" }}
            >
              📚 {tStory("chapter_badge", { chapter: story.chapter_number, total: sagaLength })}
            </span>
          )}
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
            aria-label={isFavorite ? tStory("remove_favorite") : tStory("add_favorite")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {isFavorite ? tStory("favorite") : tStory("add_favorite")}
          </button>

          {/* Download PDF */}
          <DownloadPDFButton story={story} />

          {/* Send PDF by email */}
          <SendEmailButton story={story} />

          {/* Rating */}
          <div className="flex items-center gap-1 ml-auto">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRating(star)}
                disabled={savingRating}
                className="transition-transform active:scale-110 disabled:opacity-50"
                aria-label={`${star} ★`}
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
              {tStory("characters_label")}
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

      {/* CTA — continue saga / create another */}
      <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
        {canContinueSaga && (
          <Link
            href={`/generar?continuar=${story.id}`}
            onClick={(e) => interceptLeave(e, `/generar?continuar=${story.id}`)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #98D8AA 0%, #5FA777 100%)",
            }}
          >
            📚 {tStory("continue_saga")}
          </Link>
        )}
        <Link
          href="/generar"
          onClick={(e) => interceptLeave(e, "/generar")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          }}
        >
          {tStory("create_another")}
        </Link>
      </div>

      {/* Modal — invitación a valorar */}
      {showRateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={closeModalAndLeave}
        >
          <div
            className="bg-surface-card rounded-2xl p-6 max-w-sm w-full space-y-4"
            style={{ boxShadow: "var(--shadow-ambient)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h2 className="text-lg font-semibold text-text-primary">
                {tStory("rate_title")}
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                {tStory("rate_subtitle")}
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setModalRating(star)}
                  className="transition-transform active:scale-110"
                  aria-label={`${star} ★`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill={modalRating !== null && star <= modalRating ? "#F9D976" : "none"}
                    stroke={modalRating !== null && star <= modalRating ? "#D97706" : "var(--color-text-secondary)"}
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Optional feedback */}
            <textarea
              value={modalFeedback}
              onChange={(e) => setModalFeedback(e.target.value)}
              placeholder={tStory("rate_feedback_placeholder")}
              maxLength={1000}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-transparent text-sm bg-surface-low text-text-primary placeholder:text-text-secondary outline-none focus:border-[var(--color-primary)] resize-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModalAndLeave}
                disabled={sendingModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface-low transition-colors disabled:opacity-50"
              >
                {tStory("rate_later")}
              </button>
              <button
                type="button"
                onClick={submitModalRating}
                disabled={sendingModal || modalRating === null}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--color-primary-dark)" }}
              >
                {sendingModal ? tStory("rate_sending") : tStory("rate_submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
