import Link from "next/link";
import type { Story } from "@/types/database";
import { getGenreStyle } from "@/lib/utils/genre";

type StoryPreview = Pick<
  Story,
  "id" | "title" | "content" | "genre" | "language" | "reading_time" | "is_favorite" | "created_at"
>;

interface StoryCardProps {
  story: StoryPreview;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function StoryCard({ story }: StoryCardProps) {
  const style = getGenreStyle(story.genre);
  const excerpt = story.content.slice(0, 120).trim() + "…";

  return (
    <Link
      href={`/cuento/${story.id}`}
      className="group flex flex-col bg-surface-card rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-ambient)" }}
    >
      {/* Genre header */}
      <div
        className="h-20 flex items-center justify-between px-4 flex-shrink-0"
        style={{ background: style.bg }}
      >
        <span className="text-4xl">{style.emoji}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: style.badge, color: style.text }}
        >
          {story.genre.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-display italic text-base text-primary-dark leading-snug line-clamp-2">
          {story.title}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 flex-1">
          {excerpt}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-text-secondary">
            {formatDate(story.created_at)} · {story.reading_time} min
          </span>
          {story.is_favorite && (
            <span className="text-sm" aria-label="Favorito">⭐</span>
          )}
        </div>
      </div>
    </Link>
  );
}
