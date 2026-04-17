"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9-]/g, "").slice(0, 50));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al acceder");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F3F4F6" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl"
            style={{ background: "#1E3A5F" }}
          >
            📋
          </div>
          <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Creciendo Cuento a Cuento</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            Acceso de administrador
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Código de administrador
              </label>
              <input
                type="text"
                value={code}
                onChange={handleInput}
                placeholder="XXXX-XXXX-XXXX-0000"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={50}
                disabled={loading}
                className="w-full text-center font-mono tracking-widest text-sm px-4 py-3 rounded-xl border transition-colors focus:outline-none"
                style={{
                  background: "#F9FAFB",
                  borderColor: error ? "#EF4444" : "#E5E7EB",
                }}
              />
              {error && (
                <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 10}
              className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#1E3A5F" }}
            >
              {loading ? "Accediendo…" : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
