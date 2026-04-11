"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryRow {
  id: string;
  profileId: string;
  label: string | null;
  title: string;
  content: string;
  genre: string;
  language: string;
  reading_level: string;
  reading_time: number;
  is_favorite: boolean;
  rating: number | null;
  created_at: string;
}

type SortKey = keyof Omit<StoryRow, "content" | "profileId">;
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(dateStr));
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

const LEVEL_LABELS: Record<string, string> = {
  infantil: "Infantil",
  primaria_baja: "Primaria Baja",
  primaria_media: "Primaria Media",
  primaria_alta: "Primaria Alta",
  secundaria: "Secundaria",
  adulto: "Adulto",
};

const LANGUAGES = [
  "español","catalán","gallego","inglés","francés","holandés","alemán","árabe","urdu",
];

const GENRES = [
  "Aventura","Fantasía","Cuento de hadas","Fábula","Misterio",
  "Leyenda","Ciencia ficción","Humor","Cuento de Cuna","Otro",
];

const LEVELS = [
  "infantil","primaria_baja","primaria_media","primaria_alta","secundaria","adulto",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBiblioteca() {
  const [stories,    setStories]    = useState<StoryRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [language,  setLanguage]  = useState("");
  const [genre,     setGenre]     = useState("");
  const [level,     setLevel]     = useState("");
  const [search,    setSearch]    = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }

  // Build query params
  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (dateFrom)  p.set("dateFrom",  dateFrom);
    if (dateTo)    p.set("dateTo",    dateTo);
    if (language)  p.set("language",  language);
    if (genre)     p.set("genre",     genre);
    if (level)     p.set("level",     level);
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    return p.toString();
  }, [dateFrom, dateTo, language, genre, level, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setExpandedId(null);
    fetch(`/api/admin/biblioteca?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) setError(data.error);
        else setStories(data as StoryRow[]);
      })
      .catch(() => setError("No se pudo cargar la biblioteca."))
      .finally(() => setLoading(false));
  }, [params]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = useMemo(() => {
    return [...stories].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [stories, sortKey, sortDir]);

  const hasFilters = !!(dateFrom || dateTo || language || genre || level || search);

  function clearFilters() {
    setDateFrom(""); setDateTo(""); setLanguage("");
    setGenre(""); setLevel(""); setSearch(""); setDebouncedSearch("");
  }

  const COLS: { key: SortKey; label: string }[] = [
    { key: "label",        label: "Familia" },
    { key: "title",        label: "Título" },
    { key: "genre",        label: "Género" },
    { key: "language",     label: "Idioma" },
    { key: "reading_level",label: "Nivel" },
    { key: "reading_time", label: "Duración" },
    { key: "created_at",   label: "Fecha" },
    { key: "rating",       label: "⭐" },
  ];

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca general</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todos los cuentos de todos los perfiles</p>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{stories.length}</span> cuentos
            {hasFilters && " con estos filtros"}
          </p>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
              <input
                type="date" value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
              <input
                type="date" value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
            {/* Language */}
            <select
              value={language} onChange={(e) => setLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="">Todos los idiomas</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {/* Genre */}
            <select
              value={genre} onChange={(e) => setGenre(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="">Todos los géneros</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {/* Level */}
            <select
              value={level} onChange={(e) => setLevel(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="">Todos los niveles</option>
              {LEVELS.map((lv) => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Buscar por título o familia…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 w-64"
            />
            {hasFilters && (
              <button
                onClick={clearFilters}
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-blue-300 border-t-blue-700" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">
              {hasFilters ? "Sin cuentos con estos filtros." : "Sin cuentos aún."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
                      >
                        {col.label}
                        <SortIcon dir={sortKey === col.key ? sortDir : null} />
                      </th>
                    ))}
                    {/* Expand column — no sort */}
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, i) => (
                    <>
                      <tr
                        key={s.id}
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        className="border-b border-gray-50 hover:bg-blue-50 transition-colors cursor-pointer"
                        style={{ background: expandedId === s.id ? "#EFF6FF" : i % 2 === 0 ? undefined : "#FAFAFA" }}
                      >
                        {/* Familia */}
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {s.label ?? <span className="text-gray-400 italic text-xs">Sin etiqueta</span>}
                        </td>
                        {/* Título */}
                        <td className="px-4 py-3 text-gray-800 max-w-[200px]">
                          <span className="block truncate">{s.title}</span>
                        </td>
                        {/* Género */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.genre}</td>
                        {/* Idioma */}
                        <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">{s.language}</td>
                        {/* Nivel */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {LEVEL_LABELS[s.reading_level] ?? s.reading_level}
                        </td>
                        {/* Duración */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-center">{s.reading_time} min</td>
                        {/* Fecha */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(s.created_at)}</td>
                        {/* Rating */}
                        <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                          {s.rating !== null ? `${s.rating} ⭐` : "—"}
                          {s.is_favorite && <span className="ml-1 text-red-400 text-xs">♥</span>}
                        </td>
                        {/* Toggle icon */}
                        <td className="px-4 py-3 text-center text-gray-400">
                          <span className="text-base leading-none select-none">
                            {expandedId === s.id ? "▲" : "▼"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded content row */}
                      {expandedId === s.id && (
                        <tr key={`${s.id}-content`} className="border-b border-blue-100 bg-blue-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                {s.title}
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                {s.label ?? "Sin etiqueta"} · {s.language} · {LEVEL_LABELS[s.reading_level] ?? s.reading_level} · {s.reading_time} min · {fmt(s.created_at)}
                              </span>
                            </div>
                            <div className="max-h-96 overflow-y-auto rounded-xl bg-white border border-blue-100 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {s.content}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
