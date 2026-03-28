"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const LANG_OPTIONS = [
  { value: "es", flag: "🇪🇸", label: "Español" },
  { value: "ca", flag: "🏴󠁥󠁳󠁣󠁴󠁿", label: "Català" },
  { value: "gl", flag: "🏴", label: "Galego" },
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "fr", flag: "🇫🇷", label: "Français" },
  { value: "ar", flag: "🇸🇦", label: "العربية" },
  { value: "ur", flag: "🇵🇰", label: "اردو" },
];

export default function LangSelector() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const current = LANG_OPTIONS.find((o) => o.value === locale) ?? LANG_OPTIONS[0];

  const handleSelect = async (value: string) => {
    setOpen(false);
    if (value === locale) return;
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang_ui: value }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-surface-low disabled:opacity-50"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label="Cambiar idioma"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden lg:inline font-medium text-xs">{current.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-black/8 py-1 min-w-[160px] z-50"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-surface-low transition-colors"
                style={{
                  fontWeight: opt.value === locale ? 600 : 400,
                  color:
                    opt.value === locale
                      ? "var(--color-primary-dark)"
                      : "var(--color-text-primary)",
                }}
              >
                <span className="text-base leading-none">{opt.flag}</span>
                <span>{opt.label}</span>
                {opt.value === locale && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="ml-auto"
                    style={{ color: "var(--color-primary-dark)" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
