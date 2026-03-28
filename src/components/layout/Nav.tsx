"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Nav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const LINKS = [
    { href: "/", label: t("home") },
    { href: "/generar", label: t("generate") },
    { href: "/biblioteca", label: t("library") },
    { href: "/personajes", label: t("characters") },
  ];

  return (
    <header className="hidden md:flex sticky top-0 z-40 w-full glass border-b border-black/5">
      <div className="max-w-6xl mx-auto w-full px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display italic text-xl text-primary-dark select-none">
          Creciendo Cuento a Cuento
        </Link>
        <nav className="flex items-center gap-8">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors pb-0.5 ${
                  active
                    ? "text-primary-dark border-b-2 border-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/perfil" className="text-text-secondary hover:text-text-primary transition-colors" aria-label={t("profile")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
