"use client";

import { useState, useEffect, useRef } from "react";
import type { Character } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

type EditingState = {
  id: string;
  name: string;
  description: string;
};

// ─── CharacterCard ────────────────────────────────────────────────────────────

function CharacterCard({
  character,
  onDelete,
  onSave,
}: {
  character: Character;
  onDelete: (id: string) => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditingState>({
    id: character.id,
    name: character.name,
    description: character.description,
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft({ id: character.id, name: character.name, description: character.description });
    setEditing(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditing(false);
    setConfirmDelete(false);
  };

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.description.trim()) return;
    setSaving(true);
    await onSave(character.id, draft.name.trim(), draft.description.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(character.id);
  };

  // Initials avatar
  const initials = character.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="bg-surface-card rounded-2xl overflow-hidden transition-all duration-200"
      style={{ boxShadow: "var(--shadow-ambient)" }}
    >
      {!editing ? (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary text-sm leading-snug">
                {character.name}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mt-0.5">
                {character.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={startEdit}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                background: "var(--color-surface-low)",
                color: "var(--color-text-secondary)",
              }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                background: confirmDelete ? "#FEE2E2" : "var(--color-surface-low)",
                color: confirmDelete ? "#DC2626" : "var(--color-text-secondary)",
              }}
            >
              {confirmDelete ? "¿Seguro?" : "🗑 Borrar"}
            </button>
            {confirmDelete && (
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 rounded-full font-medium"
                style={{
                  background: "var(--color-surface-low)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Editando personaje
          </p>
          <input
            ref={nameRef}
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Nombre"
            maxLength={100}
            className="w-full px-3 py-2 rounded-xl text-sm bg-surface-low border border-transparent focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/50 transition-colors"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Descripción del personaje"
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm bg-surface-low border border-transparent focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/50 resize-none transition-colors"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: "var(--color-surface-low)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !draft.name.trim() || !draft.description.trim()}
              className="text-xs px-4 py-1.5 rounded-full font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: "var(--color-primary-dark)" }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AddCharacterForm ─────────────────────────────────────────────────────────

function AddCharacterForm({ onAdd }: { onAdd: (c: Character) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) throw new Error("Error al crear el personaje");
      const data: Character = await res.json();
      onAdd(data);
      setName("");
      setDescription("");
      setOpen(false);
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        }}
      >
        + Añadir personaje
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-card rounded-2xl p-5 flex flex-col gap-3 w-full max-w-md"
      style={{ boxShadow: "var(--shadow-ambient)" }}
    >
      <p className="text-sm font-semibold text-text-primary">Nuevo personaje</p>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del personaje"
        maxLength={100}
        className="w-full px-3 py-2 rounded-xl text-sm bg-surface-low border border-transparent focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/50 transition-colors"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción breve (quién es, cómo es…)"
        maxLength={500}
        rows={3}
        className="w-full px-3 py-2 rounded-xl text-sm bg-surface-low border border-transparent focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/50 resize-none transition-colors"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setOpen(false); setName(""); setDescription(""); setError(""); }}
          className="text-sm px-4 py-2 rounded-full font-medium"
          style={{ background: "var(--color-surface-low)", color: "var(--color-text-secondary)" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim() || !description.trim()}
          className="text-sm px-5 py-2 rounded-full font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--color-primary-dark)" }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonajesPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCharacters(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (c: Character) => {
    setCharacters((prev) => [c, ...prev]);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // silent
    }
  };

  const handleSave = async (id: string, name: string, description: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const updated: Character = await res.json();
        setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display italic text-3xl text-primary-dark mb-1">
            Mis Personajes
          </h1>
          <p className="text-text-secondary text-sm">
            {loading
              ? "Cargando…"
              : `${characters.length} personaje${characters.length !== 1 ? "s" : ""} guardado${characters.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <AddCharacterForm onAdd={handleAdd} />
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface-low animate-pulse h-36"
            />
          ))}
        </div>
      ) : characters.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎭</p>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Aún no hay personajes
          </h2>
          <p className="text-text-secondary text-sm">
            Crea tu primer personaje para que aparezca en tus cuentos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDelete}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
