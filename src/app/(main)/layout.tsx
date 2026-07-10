import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import Nav from "@/components/layout/Nav";
import BottomNav from "@/components/layout/BottomNav";
import LangSelector from "@/components/layout/LangSelector";
import LanguageOnboarding from "@/components/layout/LanguageOnboarding";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/acceso");

  // Primer acceso: la familia aún no ha elegido idioma de interfaz
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("lang_ui_chosen")
    .eq("id", session.profileId)
    .single();
  const needsLanguageOnboarding = profile ? !profile.lang_ui_chosen : false;

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      {needsLanguageOnboarding && <LanguageOnboarding />}
      <Nav />
      {/* Mobile top bar — only visible on small screens */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-12 border-b border-black/5" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
        <span className="font-display italic text-primary-dark text-sm">Creciendo Cuento a Cuento</span>
        <LangSelector />
      </div>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
