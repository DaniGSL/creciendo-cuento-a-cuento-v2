"use client";

import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  last_access: string;
  lang_ui: string;
  storyCount: number;
  favoritesCount: number;
  avgRating: number | null;
}

type SortKey = keyof ProfileRow;
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPerfiles() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/admin/perfiles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) setError(data.error);
        else setProfiles(data as ProfileRow[]);
      })
      .catch(() => setError("No se pudieron cargar los perfiles."))
      .finally(() => setLoading(false));
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let rows = profiles;
    if (status === "active")   rows = rows.filter((p) => p.is_active);
    if (status === "inactive") rows = rows.filter((p) => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => (p.label ?? "Sin etiqueta").toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [profiles, status, search, sortKey, sortDir]);

  const activeCount   = profiles.filter((p) => p.is_active).length;
  const inactiveCount = profiles.filter((p) => !p.is_active).length;

  const COLS: { key: SortKey; label: string }[] = [
    { key: "label",         label: "Etiqueta" },
    { key: "is_active",     label: "Estado" },
    { key: "created_at",    label: "Registrado" },
    { key: "last_access",   label: "Último acceso" },
    { key: "storyCount",    label: "Cuentos" },
    { key: "favoritesCount",label: "Favoritos" },
    { key: "avgRating",     label: "Valoración" },
    { key: "lang_ui",       label: "Idioma UI" },
  ];

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfiles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Actividad por familia</p>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{profiles.length}</span> perfiles ·{" "}
            <span className="text-green-600 font-medium">{activeCount}</span> activos ·{" "}
            <span className="text-gray-400">{inactiveCount}</span> inactivos
          </p>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="px-3 py-1.5 transition-colors"
                style={{
                  background: status === s ? "#1E3A5F" : "#fff",
                  color:      status === s ? "#fff"    : "#374151",
                }}
              >
                {s === "all" ? "Todos" : s === "active" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por etiqueta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 w-52"
          />
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
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">Sin perfiles con estos filtros.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      style={{ background: i % 2 === 0 ? undefined : "#FAFAFA" }}
                    >
                      {/* Etiqueta */}
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.label ?? <span className="text-gray-400 italic text-xs">Sin etiqueta</span>}
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: p.is_active ? "#DCFCE7" : "#F3F4F6",
                            color:      p.is_active ? "#166534" : "#6B7280",
                          }}
                        >
                          {p.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {/* Registrado */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(p.created_at)}</td>
                      {/* Último acceso */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(p.last_access)}</td>
                      {/* Cuentos */}
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{p.storyCount}</td>
                      {/* Favoritos */}
                      <td className="px-4 py-3 text-center text-gray-500">{p.favoritesCount}</td>
                      {/* Valoración */}
                      <td className="px-4 py-3 text-center text-gray-700">
                        {p.avgRating !== null ? `${p.avgRating} ⭐` : "—"}
                      </td>
                      {/* Idioma UI */}
                      <td className="px-4 py-3 text-gray-500 capitalize">{p.lang_ui}</td>
                    </tr>
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
