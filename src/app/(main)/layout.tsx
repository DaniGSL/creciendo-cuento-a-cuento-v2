import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/layout/Nav";
import BottomNav from "@/components/layout/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/acceso");

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
