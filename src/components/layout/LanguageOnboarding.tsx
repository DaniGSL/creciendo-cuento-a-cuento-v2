"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Modal de bienvenida en el primer acceso: la familia elige el idioma de la
 * interfaz sin tener que navegar antes en un idioma que no entiende.
 * Cada opción se muestra en su propio idioma (no se traduce).
 */
const LANG_OPTIONS = [
  { value: "es", flag: "🇪🇸", label: "Español" },
  { value: "ca", flag: "🏴", label: "Català" },
  { value: "gl", flag: "🐚", label: "Galego" },
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "fr", flag: "🇫🇷", label: "Français" },
  { value: "pt", flag: "🇵🇹", label: "Português" },
  { value: "ar", flag: "🇲🇦", label: "العربية" },
  { value: "ur", flag: "🇵🇰", label: "اردو" },
  { value: "ru", flag: "🇷🇺", label: "Русский" },
];

export default function LanguageOnboarding() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const confirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang_ui: selected }),
      });
      setDone(true);
      router.refresh();
    } catch {
      setSaving(false);
    }
  };

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="bg-surface-card rounded-2xl p-6 max-w-md w-full space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🌍</div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          <p className="text-xs text-text-secondary mt-1">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className="px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all text-left flex items-center gap-2"
              style={{
                borderColor:
                  selected === opt.value
                    ? "var(--color-primary-dark)"
                    : "var(--color-surface-low)",
                background:
                  selected === opt.value
                    ? "rgba(125,167,240,0.12)"
                    : "var(--color-surface-low)",
                color:
                  selected === opt.value
                    ? "var(--color-primary-dark)"
                    : "var(--color-text-primary)",
              }}
            >
              <span>{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={!selected || saving}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          }}
        >
          {saving ? "…" : t("confirm")}
        </button>

        <p className="text-[11px] text-text-secondary text-center">
          {t("changeable_note")}
        </p>
      </div>
    </div>
  );
}
