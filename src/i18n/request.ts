import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const VALID_LOCALES = ["es", "ca", "gl", "en", "fr", "ar", "ur"] as const;
type Locale = (typeof VALID_LOCALES)[number];

function isValidLocale(v: string): v is Locale {
  return VALID_LOCALES.includes(v as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("lang_ui")?.value ?? "es";
  const locale: Locale = isValidLocale(raw) ? raw : "es";

  const messagesMap: Record<Locale, () => Promise<{ default: object }>> = {
    es: () => import("../../messages/es.json"),
    ca: () => import("../../messages/ca.json"),
    gl: () => import("../../messages/gl.json"),
    en: () => import("../../messages/en.json"),
    fr: () => import("../../messages/fr.json"),
    ar: () => import("../../messages/ar.json"),
    ur: () => import("../../messages/ur.json"),
  };

  const messages = (await messagesMap[locale]()).default;

  return { locale, messages };
});
