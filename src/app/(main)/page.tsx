import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import { GENRE_STYLES } from "@/lib/utils/genre";
import type { Story, Character } from "@/types/database";

export default async function HomePage() {
  const session = await getSession();
  const supabase = createServerClient();

  const [storiesResult, charactersResult] = await Promise.all([
    supabase
      .from("stories")
      .select("id, title, genre, language, reading_time, created_at")
      .eq("profile_id", session!.profileId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("characters")
      .select("id, name")
      .eq("profile_id", session!.profileId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const t = await getTranslations("home");

  const stories = (storiesResult.data ?? []) as Pick<
    Story,
    "id" | "title" | "genre" | "language" | "reading_time" | "created_at"
  >[];
  const characters = (charactersResult.data ?? []) as Pick<
    Character,
    "id" | "name"
  >[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Hero */}
      <section
        className="rounded-3xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden relative"
        style={{
          background:
            "linear-gradient(135deg, rgba(125,167,240,0.18) 0%, rgba(152,216,170,0.12) 100%)",
        }}
      >
        <div className="flex-[3] space-y-4">
          <h1 className="font-display italic text-3xl md:text-4xl text-primary-dark leading-tight">
            {t("hero_title").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-text-secondary text-sm md:text-base">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/generar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {t("create_story")}
            </Link>
            <Link
              href="/biblioteca"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold border-2 transition-colors"
              style={{
                borderColor: "var(--color-primary-dark)",
                color: "var(--color-primary-dark)",
              }}
            >
              {t("view_library")}
            </Link>
          </div>
        </div>
        {/* Hero image */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-center" style={{ width: 220, height: 220 }}>
          <Image
            src="/hero-magic.webp"
            alt="Libro mágico de cuentos"
            width={220}
            height={220}
            priority
            style={{ objectFit: "contain", borderRadius: "1rem" }}
          />
        </div>
      </section>

      {/* Content grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent stories */}
        <div className="md:col-span-2 bg-surface-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-ambient)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📖</span>
              <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                {t("my_library")}
              </h2>
            </div>
            {stories.length > 0 && (
              <Link href="/biblioteca" className="text-xs font-medium text-primary-dark hover:underline">
                {t("see_all")}
              </Link>
            )}
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm font-medium text-text-primary mb-1">
                {t("no_stories_title")}
              </p>
              <p className="text-xs text-text-secondary mb-4">
                {t("no_stories_subtitle")}
              </p>
              <Link
                href="/generar"
                className="inline-block px-4 py-2 rounded-full text-xs font-semibold text-white"
                style={{ background: "var(--color-primary-dark)" }}
              >
                {t("create_story_btn")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {stories.map((story) => {
                const style = GENRE_STYLES[story.genre];
                return (
                  <li key={story.id}>
                    <Link
                      href={`/cuento/${story.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-surface-low"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                        style={{ background: style.bg }}
                      >
                        {style.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {story.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {story.reading_time} min · {story.language}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: style.badge, color: style.text }}
                      >
                        {story.genre.toUpperCase()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Characters */}
        <div
          className="bg-surface-card rounded-2xl p-5"
          style={{
            boxShadow: "var(--shadow-ambient)",
            background: "linear-gradient(135deg, rgba(152,216,170,0.1) 0%, white 60%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">😊</span>
              <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                {t("characters_section")}
              </h2>
            </div>
            {characters.length > 0 && (
              <Link href="/personajes" className="text-xs font-medium text-primary-dark hover:underline">
                {t("see_all")}
              </Link>
            )}
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🎭</p>
              <p className="text-sm text-text-secondary">
                {t("characters_empty")}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {characters.map((char) => (
                <span
                  key={char.id}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(152,216,170,0.25)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {char.name}
                </span>
              ))}
            </div>
          )}

          <Link
            href="/generar"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border-2 border-dashed transition-colors"
            style={{
              borderColor: "var(--color-secondary)",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("create_new")}
          </Link>
        </div>
      </div>
    </div>
  );
}
