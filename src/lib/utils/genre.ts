import type { StoryGenre } from "@/types/database";

export interface GenreStyle {
  emoji: string;
  bg: string; // light tint for card bg
  badge: string; // solid color for badge
  text: string; // text color on badge
}

export const GENRE_STYLES: Record<StoryGenre, GenreStyle> = {
  Aventura:          { emoji: "⚔️",  bg: "#EBF2FF", badge: "#7DA7F0", text: "#1E3A5F" },
  Fantasía:          { emoji: "✨",  bg: "#F3F0FF", badge: "#C4B5FD", text: "#4C1D95" },
  "Cuento de hadas": { emoji: "🧚", bg: "#FDF2F8", badge: "#E879F9", text: "#701A75" },
  Fábula:            { emoji: "🦊",  bg: "#ECFDF5", badge: "#34D399", text: "#065F46" },
  Misterio:          { emoji: "🔍",  bg: "#F9FAFB", badge: "#6B7280", text: "#ffffff" },
  Leyenda:           { emoji: "🏔️", bg: "#FFF7ED", badge: "#FB923C", text: "#7C2D12" },
  "Ciencia ficción": { emoji: "🚀",  bg: "#EFF6FF", badge: "#1E3A5F", text: "#ffffff" },
  Humor:             { emoji: "😄",  bg: "#FEFCE8", badge: "#FACC15", text: "#713F12" },
  "Cuento de Cuna":  { emoji: "🌙",  bg: "#FFFBEB", badge: "#FDE68A", text: "#92400E" },
  Otro:              { emoji: "✏️",  bg: "#FFF7ED", badge: "#F97316", text: "#ffffff" },
};

export const GENRES = Object.keys(GENRE_STYLES) as StoryGenre[];

export const GENRE_KEY_MAP: Record<StoryGenre, string> = {
  "Aventura":          "genre_aventura",
  "Fantasía":          "genre_fantasia",
  "Cuento de hadas":   "genre_cuento_hadas",
  "Fábula":            "genre_fabula",
  "Misterio":          "genre_misterio",
  "Leyenda":           "genre_leyenda",
  "Ciencia ficción":   "genre_ciencia_ficcion",
  "Humor":             "genre_humor",
  "Cuento de Cuna":    "genre_cuento_cuna",
  "Otro":              "genre_otro",
};

export function getGenreStyle(genre: string): GenreStyle {
  return GENRE_STYLES[genre as StoryGenre] ?? GENRE_STYLES["Otro"];
}
