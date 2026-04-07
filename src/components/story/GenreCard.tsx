import type { StoryGenre } from "@/types/database";
import { getGenreStyle } from "@/lib/utils/genre";

interface GenreCardProps {
  genre: StoryGenre;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function GenreCard({ genre, label, selected, onClick }: GenreCardProps) {
  const style = getGenreStyle(genre);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-sm font-medium"
      style={{
        borderColor: selected ? style.badge : "transparent",
        background: selected ? style.bg : "var(--color-surface-low)",
        color: selected ? style.text : "var(--color-text-secondary)",
      }}
    >
      <span className="text-2xl leading-none">{style.emoji}</span>
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
