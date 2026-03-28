import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import StoryReader from "@/components/story/StoryReader";
import type { Story } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("stories")
    .select("title")
    .eq("id", id)
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

  return <StoryReader story={data as Story} />;
}
