"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/codigos", label: "Códigos" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "#1E3A5F",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <span className="text-white font-semibold text-sm flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">📋</span>
          <span className="hidden sm:inline opacity-75">Admin ·</span>
          <span>Creciendo Cuento a Cuento</span>
        </span>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
          style={{
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}
