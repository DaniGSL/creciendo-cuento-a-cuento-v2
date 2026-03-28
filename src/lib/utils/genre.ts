import type { StoryGenre } from "@/types/database";

export interface GenreStyle {
  emoji: string;
  bg: string; // light tint for card bg
  badge: string; // solid color for badge
  text: string; // text color on badge
}

export const GENRE_STYLES: Record<StoryGenre, GenreStyle> = {
  Aventura: { emoji: "🗺️", bg: "#EBF2FF", badge: "#7DA7F0", text: "#1E3A5F" },
  Fantasía: { emoji: "✨", bg: "#F3F0FF", badge: "#C4B5FD", text: "#4C1D95" },
  Animales: { emoji: "🐾", bg: "#ECFDF5", badge: "#98D8AA", text: "#065F46" },
  Espacio: { emoji: "🚀", bg: "#EFF6FF", badge: "#1E3A5F", text: "#ffffff" },
  Naturaleza: { emoji: "🌿", bg: "#F0FDF4", badge: "#86EFAC", text: "#14532D" },
  "Cuento de Cuna": {
    emoji: "🌙",
    bg: "#FFFBEB",
    badge: "#FDE68A",
    text: "#92400E",
  },
  Amistad: { emoji: "🤝", bg: "#FEFCE8", badge: "#F9D976", text: "#713F12" },
  Misterio: { emoji: "🔍", bg: "#F9FAFB", badge: "#6B7280", text: "#ffffff" },
};

export const GENRES = Object.keys(GENRE_STYLES) as StoryGenre[];
