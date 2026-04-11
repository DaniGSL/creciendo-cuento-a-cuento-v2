"use client";

import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenreStat    { genre: string;    count: number; avgRating: number | null }
interface LevelStat    { level: string;    count: number; avgRating: number | null }
interface LangStat     { language: string; count: number; avgRating: number | null }
interface DurationStat { minutes: number;  count: number; avgRating: number | null }
interface WeekStat     { week: string;     count: number }

interface Stats {
  codes: { total: number; active: number; inactive: number };
  profiles: number;
  stories: number;
  avgRating: number | null;
  ratedCount: number;
  favoritesCount: number;
  genreStats: GenreStat[];
  levelStats: LevelStat[];
  languageStats: LangStat[];
  durationStats: DurationStat[];
  weeklyStats: WeekStat[];
}

type Preset = "today" | "week" | "month" | "3months" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetDates(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = toYMD(today);
  if (preset === "today")   return { from: to, to };
  if (preset === "week")    { const d = new Date(today); d.setDate(d.getDate() - 6);   return { from: toYMD(d), to }; }
  if (preset === "month")   { const d = new Date(today); d.setDate(d.getDate() - 29);  return { from: toYMD(d), to }; }
  if (preset === "3months") { const d = new Date(today); d.setDate(d.getDate() - 89);  return { from: toYMD(d), to }; }
  return { from: "", to: "" }; // "all"
}

const LANGUAGES = [
  "español","catalán","gallego","inglés","francés","holandés","alemán","árabe","urdu",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold leading-none" style={{ color: color ?? "#1E3A5F" }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function HBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "#7DA7F0" }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

const LEVEL_LABELS: Record<string, string> = {
  infantil: "Infantil", primaria_baja: "Primaria Baja", primaria_media: "Primaria Media",
  primaria_alta: "Primaria Alta", secundaria: "Secundaria", adulto: "Adulto",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [preset,     setPreset]     = useState<Preset>("all");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [langFilter, setLangFilter] = useState("");

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);
    if (langFilter) params.set("lang",   langFilter);
    fetch(`/api/admin/stats?${params}`)
      .then((r) => r.json())
      .then((data) => { if (data?.error) setError(data.error); else setStats(data as Stats); })
      .catch(() => setError("No se pudieron cargar las estadísticas."))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, langFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function applyPreset(p: Preset) {
    setPreset(p);
    const { from, to } = presetDates(p);
    setDateFrom(from);
    setDateTo(to);
  }

  const maxGenre    = Math.max(...(stats?.genreStats.map((g) => g.count)    ?? [1]));
  const maxLevel    = Math.max(...(stats?.levelStats.map((l) => l.count)    ?? [1]));
  const maxLang     = Math.max(...(stats?.languageStats.map((l) => l.count) ?? [1]));
  const maxDuration = Math.max(...(stats?.durationStats.map((d) => d.count) ?? [1]));
  const maxWeek     = Math.max(...(stats?.weeklyStats.map((w) => w.count)   ?? [1]));

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today",   label: "Hoy" },
    { key: "week",    label: "7 días" },
    { key: "month",   label: "30 días" },
    { key: "3months", label: "3 meses" },
    { key: "all",     label: "Todo" },
  ];

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista general de la plataforma</p>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  background: preset === p.key ? "#1E3A5F" : "transparent",
                  color:      preset === p.key ? "#fff"    : "#374151",
                  borderColor:preset === p.key ? "#1E3A5F" : "#D1D5DB",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom date + language */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPreset("all"); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPreset("all"); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Idioma</label>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="">Todos</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {(dateFrom || dateTo || langFilter) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setLangFilter(""); setPreset("all"); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        )}

        {/* ── Stat cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Códigos activos" value={stats.codes.active}
              sub={`de ${stats.codes.total} en total`} color="#2d5b9f" />
            <StatCard label="Perfiles activos" value={stats.profiles}
              sub={dateFrom || dateTo ? "en el período" : "familias registradas"} />
            <StatCard label="Cuentos generados" value={stats.stories}
              sub={`${stats.favoritesCount} favoritos`} />
            <StatCard label="Valoración media"
              value={stats.avgRating !== null ? `${stats.avgRating} ⭐` : "—"}
              sub={stats.ratedCount > 0 ? `${stats.ratedCount} valorados` : "Sin valoraciones"}
              color="#D97706" />
          </div>
        )}

        {/* ── Charts ── */}
        {stats && (
          <div className="space-y-6">
            {/* 2×2 grid of bar charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Genre */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Cuentos por género</h2>
                {stats.genreStats.length === 0 ? <p className="text-sm text-gray-400">Sin datos</p> : (
                  <div className="space-y-3">
                    {stats.genreStats.map((g) => <HBar key={g.genre} label={g.genre} count={g.count} max={maxGenre} />)}
                  </div>
                )}
              </div>

              {/* Reading level */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Nivel de lectura</h2>
                {stats.levelStats.length === 0 ? <p className="text-sm text-gray-400">Sin datos</p> : (
                  <div className="space-y-3">
                    {stats.levelStats.map((l) => (
                      <HBar key={l.level} label={LEVEL_LABELS[l.level] ?? l.level} count={l.count} max={maxLevel} />
                    ))}
                  </div>
                )}
              </div>

              {/* Language */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Idioma del cuento</h2>
                {stats.languageStats.length === 0 ? <p className="text-sm text-gray-400">Sin datos</p> : (
                  <div className="space-y-3">
                    {stats.languageStats.map((l) => (
                      <HBar key={l.language} label={l.language} count={l.count} max={maxLang} />
                    ))}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Duración del cuento</h2>
                {stats.durationStats.length === 0 ? <p className="text-sm text-gray-400">Sin datos</p> : (
                  <div className="space-y-3">
                    {stats.durationStats.map((d) => (
                      <HBar key={d.minutes} label={`${d.minutes} min`} count={d.count} max={maxDuration} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly activity — full width */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Actividad semanal
                {(dateFrom || dateTo) ? " (período filtrado)" : " — últimas 8 semanas"}
              </h2>
              {stats.weeklyStats.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="flex items-end gap-2 h-28">
                  {stats.weeklyStats.map((w) => {
                    const pct = maxWeek > 0 ? (w.count / maxWeek) * 100 : 0;
                    const weekLabel = new Intl.DateTimeFormat("es-ES", {
                      day: "numeric", month: "short",
                    }).format(new Date(w.week));
                    return (
                      <div key={w.week} className="flex-1 flex flex-col items-center gap-1"
                        title={`${weekLabel}: ${w.count} cuentos`}>
                        <span className="text-[10px] text-gray-500">{w.count || ""}</span>
                        <div className="w-full flex items-end" style={{ height: "72px" }}>
                          <div className="w-full rounded-t-md transition-all"
                            style={{ height: `${Math.max(pct, w.count > 0 ? 4 : 0)}%`, background: "#7DA7F0" }} />
                        </div>
                        <span className="text-[9px] text-gray-400 text-center leading-tight">{weekLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
