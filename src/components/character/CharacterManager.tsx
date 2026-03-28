"use client";

import { useState, useEffect } from "react";
import type { Character, StoryCharacter } from "@/types/database";

interface CharacterManagerProps {
  selectedCharacters: StoryCharacter[];
  onSelectionChange: (chars: StoryCharacter[]) => void;
}

export default function CharacterManager({
  selectedCharacters,
  onSelectionChange,
}: CharacterManagerProps) {
  const [saved, setSaved] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSaved(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (id: string) =>
    selectedCharacters.some((c) => c.id === id);

  const toggleSaved = (char: Character) => {
    if (isSelected(char.id)) {
      onSelectionChange(selectedCharacters.filter((c) => c.id !== char.id));
    } else {
      onSelectionChange([
        ...selectedCharacters,
        { id: char.id, name: char.name, description: char.description },
      ]);
    }
  };

  const removeSelected = (id: string) => {
    onSelectionChange(selectedCharacters.filter((c) => c.id !== id));
  };

  const handleAddNew = async () => {
    if (!newName.trim() || !newDesc.trim()) return;
    setAdding(true);
    try {
      let charId = `new-${Date.now()}`;

      if (saveForLater) {
        const res = await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
        });
        const created = await res.json();
        if (res.ok && created.id) {
          charId = created.id;
          setSaved((prev) => [created, ...prev]);
        }
      }

      onSelectionChange([
        ...selectedCharacters,
        { id: charId, name: newName.trim(), description: newDesc.trim() },
      ]);

      setNewName("");
      setNewDesc("");
      setSaveForLater(false);
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          ¿Quiénes son los protagonistas?
        </h2>
        <p className="text-sm text-text-secondary">
          Selecciona personajes guardados o añade nuevos.
        </p>
      </div>

      {/* Saved characters */}
      {loading ? (
        <div className="text-sm text-text-secondary">Cargando personajes...</div>
      ) : saved.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
            Mis personajes
          </p>
          <div className="flex flex-wrap gap-2">
            {saved.map((char) => {
              const sel = isSelected(char.id);
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => toggleSaved(char)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: sel ? "var(--color-primary)" : "var(--color-surface-low)",
                    background: sel ? "var(--color-primary)" : "var(--color-surface-low)",
                    color: sel ? "white" : "var(--color-text-primary)",
                  }}
                >
                  {sel ? "✓ " : ""}{char.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* New character form */}
      {showForm ? (
        <div className="rounded-xl border border-black/8 p-4 space-y-3 bg-surface-low">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del personaje"
            className="w-full px-3 py-2 rounded-lg bg-white border border-black/8 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            maxLength={100}
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descripción breve (quién es, cómo es, qué le gusta…)"
            className="w-full px-3 py-2 rounded-lg bg-white border border-black/8 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
            rows={3}
            maxLength={500}
          />
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={saveForLater}
              onChange={(e) => setSaveForLater(e.target.checked)}
              className="rounded"
            />
            Guardar para futuros cuentos
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              disabled={!newName.trim() || !newDesc.trim() || adding}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--color-primary-dark)" }}
            >
              {adding ? "Añadiendo..." : "Añadir a la historia"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(""); setNewDesc(""); }}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary bg-white border border-black/8"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed text-sm font-medium transition-colors"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary-dark)" }}
        >
          <span className="text-lg leading-none">+</span>
          Añadir personaje nuevo
        </button>
      )}

      {/* Selected list */}
      {selectedCharacters.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
            En esta historia ({selectedCharacters.length})
          </p>
          <ul className="space-y-2">
            {selectedCharacters.map((char) => (
              <li
                key={char.id}
                className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl bg-surface-low"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {char.name}
                  </p>
                  <p className="text-xs text-text-secondary line-clamp-1">
                    {char.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelected(char.id)}
                  className="text-text-secondary hover:text-danger flex-shrink-0 mt-0.5"
                  aria-label="Quitar personaje"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
