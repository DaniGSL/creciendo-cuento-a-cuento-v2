"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccessCode {
  code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(d));
}

function downloadCsv(codes: AccessCode[]) {
  const header = "Código,Etiqueta,Activo,Creado";
  const rows = codes.map(
    (c) => `${c.code},"${c.label ?? ""}",${c.is_active ? "Sí" : "No"},${c.created_at}`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `codigos_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Single-code form ─────────────────────────────────────────────────────────

function NewCodeForm({ onCreated }: { onCreated: (c: AccessCode) => void }) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      onCreated(data as AccessCode);
      setLabel("");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-44">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Etiqueta interna (opcional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Familia García"
          maxLength={100}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>
      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: "#2d5b9f" }}
      >
        {saving ? "Generando…" : "Generar código"}
      </button>
    </form>
  );
}

// ─── Bulk form ────────────────────────────────────────────────────────────────

function BulkForm({ onCreated }: { onCreated: (codes: AccessCode[]) => void }) {
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          count,
          label_prefix: prefix.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      const codes = data.codes as AccessCode[];
      onCreated(codes);
      downloadCsv(codes);
      setPrefix("");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Cantidad (1–50)
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
          className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>
      <div className="flex-1 min-w-40">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Prefijo de etiqueta (opcional)
        </label>
        <input
          type="text"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="Lote Enero"
          maxLength={80}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>
      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center gap-1.5"
        style={{ background: "#065F46" }}
      >
        {saving ? "Generando…" : (
          <>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Generar lote + CSV
          </>
        )}
      </button>
    </form>
  );
}

// ─── Code row ─────────────────────────────────────────────────────────────────

function CodeRow({
  code,
  onToggle,
  onDelete,
}: {
  code: AccessCode;
  onToggle: (c: string, active: boolean) => Promise<void>;
  onDelete: (c: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(code.code, !code.is_active);
    setToggling(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-800 font-medium select-all">
            {code.code}
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Copiar código"
          >
            {copied ? (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
        </div>
      </td>

      {/* Label */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600 truncate max-w-[180px] inline-block">
          {code.label ?? <span className="text-gray-300 italic">Sin etiqueta</span>}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{
            background: code.is_active ? "#DCFCE7" : "#FEE2E2",
            color: code.is_active ? "#166534" : "#991B1B",
          }}
          title={code.is_active ? "Clic para desactivar" : "Clic para activar"}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: code.is_active ? "#22C55E" : "#EF4444" }}
          />
          {code.is_active ? "Activo" : "Inactivo"}
        </button>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-400">
        {formatDate(code.created_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Eliminar código"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-500">¿Seguro?</span>
            <button
              onClick={() => onDelete(code.code)}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Sí
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              No
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Panel = "none" | "single" | "bulk";

export default function CodigosPage() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [panel, setPanel] = useState<Panel>("none");

  useEffect(() => {
    fetch("/api/admin/codes")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCodes(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return codes.filter((c) => {
      if (filterStatus === "active" && !c.is_active) return false;
      if (filterStatus === "inactive" && c.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          (c.label ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [codes, search, filterStatus]);

  const handleCreated = (c: AccessCode) => {
    setCodes((prev) => [c, ...prev]);
    setPanel("none");
  };

  const handleBulkCreated = (newCodes: AccessCode[]) => {
    setCodes((prev) => [...newCodes, ...prev]);
    setPanel("none");
  };

  const handleToggle = async (code: string, active: boolean) => {
    const res = await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    if (res.ok) {
      setCodes((prev) =>
        prev.map((c) => (c.code === code ? { ...c, is_active: active } : c))
      );
    }
  };

  const handleDelete = async (code: string) => {
    const res = await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.code !== code));
    }
  };

  const activeCount = codes.filter((c) => c.is_active).length;
  const inactiveCount = codes.length - activeCount;

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Códigos de acceso</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Cargando…"
                : `${activeCount} activos · ${inactiveCount} inactivos · ${codes.length} en total`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPanel(panel === "single" ? "none" : "single")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: "#2d5b9f" }}
            >
              + Nuevo código
            </button>
            <button
              onClick={() => setPanel(panel === "bulk" ? "none" : "bulk")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: "#065F46" }}
            >
              Generar lote
            </button>
            {codes.length > 0 && (
              <button
                onClick={() => downloadCsv(filtered)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 transition-colors"
              >
                ↓ Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Inline panel */}
        {panel !== "none" && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {panel === "single" ? "Generar un nuevo código" : "Generar lote de códigos"}
            </h2>
            {panel === "single" ? (
              <NewCodeForm onCreated={handleCreated} />
            ) : (
              <BulkForm onCreated={handleBulkCreated} />
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o etiqueta…"
            className="flex-1 min-w-52 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
          />
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                borderColor: filterStatus === f ? "#2d5b9f" : "#E5E7EB",
                background: filterStatus === f ? "#EBF2FF" : "white",
                color: filterStatus === f ? "#2d5b9f" : "#6B7280",
              }}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Cargando códigos…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-3">🔑</p>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {codes.length === 0 ? "No hay códigos todavía" : "No hay resultados"}
              </p>
              <p className="text-xs text-gray-400">
                {codes.length === 0
                  ? "Genera el primer código con el botón de arriba"
                  : "Prueba con otros términos de búsqueda"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Etiqueta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Creado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((code) => (
                    <CodeRow
                      key={code.code}
                      code={code}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
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
