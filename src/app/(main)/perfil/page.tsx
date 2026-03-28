"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
  totalStories: number;
  totalCharacters: number;
  totalReadingMinutes: number;
  favoritesCount: number;
  avgRating: number | null;
  langUi: string;
  memberSince: string | null;
}

// ─── Language options ─────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { value: "es", label: "🇪🇸 Español" },
  { value: "ca", label: "🏴󠁥󠁳󠁣󠁴󠁿 Català" },
  { value: "gl", label: "🏴 Galego" },
  { value: "en", label: "🇬🇧 English" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string | number;
  label: string;
}) {
  return (
    <div
      className="bg-surface-card rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center"
      style={{ boxShadow: "var(--shadow-ambient)" }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xl font-bold text-text-primary leading-none">
        {value}
      </span>
      <span className="text-xs text-text-secondary leading-snug">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState("es");
  const [savingLang, setSavingLang] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileStats) => {
        if (data && !("error" in data)) {
          setStats(data);
          setSelectedLang(data.langUi ?? "es");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLangChange = async (lang: string) => {
    setSelectedLang(lang);
    setSavingLang(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang_ui: lang }),
      });
      router.refresh();
    } catch {
      // silent — preference saved optimistically
    } finally {
      setSavingLang(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/acceso");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  // Member since formatted
  const memberSinceFormatted = stats?.memberSince
    ? new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }).format(new Date(stats.memberSince))
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(125,167,240,0.2) 0%, rgba(152,216,170,0.2) 100%)",
          }}
        >
          📖
        </div>
        <div className="text-center">
          <h1 className="font-display italic text-2xl text-primary-dark">
            {t("title")}
          </h1>
          {memberSinceFormatted && (
            <p className="text-xs text-text-secondary mt-0.5">
              {t("member_since")} {memberSinceFormatted}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">
          {t("stats_heading")}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface-low animate-pulse h-24"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              emoji="📚"
              value={stats?.totalStories ?? 0}
              label={t("stories_created")}
            />
            <StatCard
              emoji="🎭"
              value={stats?.totalCharacters ?? 0}
              label={t("characters_stat")}
            />
            <StatCard
              emoji="⏱"
              value={stats?.totalReadingMinutes ?? 0}
              label={t("reading_min")}
            />
            <StatCard
              emoji="⭐"
              value={stats?.favoritesCount ?? 0}
              label={t("favorites")}
            />
          </div>
        )}

        {stats?.avgRating !== null && stats?.avgRating !== undefined && (
          <p className="text-xs text-text-secondary text-center mt-3">
            {t("avg_rating_prefix")}{" "}
            <span className="font-semibold text-text-primary">
              {stats.avgRating} / 5 ⭐
            </span>
          </p>
        )}
      </section>

      {/* Language preference */}
      <section
        className="bg-surface-card rounded-2xl p-5"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          {t("lang_title")}
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          {t("lang_subtitle")}
          {savingLang && (
            <span className="ml-2 text-primary-dark animate-pulse">
              {t("saving")}
            </span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleLangChange(opt.value)}
              disabled={savingLang}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all disabled:opacity-60 text-left"
              style={{
                borderColor:
                  selectedLang === opt.value
                    ? "var(--color-primary-dark)"
                    : "var(--color-surface-low)",
                background:
                  selectedLang === opt.value
                    ? "rgba(125,167,240,0.12)"
                    : "var(--color-surface-low)",
                color:
                  selectedLang === opt.value
                    ? "var(--color-primary-dark)"
                    : "var(--color-text-secondary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section
        className="bg-surface-card rounded-2xl p-5"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          {t("session_title")}
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          {t("session_desc")}
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-3 px-6 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}
        >
          {loggingOut ? t("logging_out") : t("logout_btn")}
        </button>
      </section>

      {/* Privacy note */}
      <p className="text-xs text-text-secondary text-center leading-relaxed pb-4">
        {t("privacy")}
      </p>
    </div>
  );
}
