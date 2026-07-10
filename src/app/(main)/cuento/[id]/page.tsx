import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import StoryReader from "@/components/story/StoryReader";
import type { Story } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getSession();
  if (!session) {
    return { title: "Cuento · Creciendo Cuento a Cuento" };
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("stories")
    .select("title")
    .eq("id", id)
    .eq("profile_id", session.profileId)
    .single();
  return {
    title: data?.title
      ? `${data.title} · Creciendo Cuento a Cuento`
      : "Cuento · Creciendo Cuento a Cuento",
  };
}

export default async function CuentoPage({ params }: Props) {
  // Ensure cookies are read (Next.js 16 requires explicit usage)
  await cookies();

  const session = await getSession();
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("profile_id", session!.profileId)
    .single();

  if (error || !data) notFound();

  const story = data as Story;

  // Info de saga: cuántos capítulos tiene y si este es el último
  let sagaLength = 1;
  let isLastChapter = true;
  if (story.saga_id) {
    const { data: chapters } = await supabase
      .from("stories")
      .select("id, chapter_number")
      .eq("profile_id", session!.profileId)
      .eq("saga_id", story.saga_id)
      .order("chapter_number", { ascending: true });
    if (chapters?.length) {
      sagaLength = chapters.length;
      isLastChapter = chapters[chapters.length - 1].id === story.id;
    }
  }

  return (
    <StoryReader
      story={story}
      sagaLength={sagaLength}
      isLastChapter={isLastChapter}
    />
  );
}
