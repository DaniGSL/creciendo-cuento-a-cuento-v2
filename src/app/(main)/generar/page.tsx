import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import StoryForm from "@/components/story/StoryForm";

export const metadata: Metadata = {
  title: "Crear Cuento · Creciendo Cuento a Cuento",
};

export default async function GenerarPage() {
  const t = await getTranslations("generate");

  return (
    <div>
      {/* Page header */}
      <div className="text-center pt-8 pb-2 px-4 relative">
        {/* Decorative sparkles */}
        <span className="absolute top-6 right-8 text-3xl opacity-20 select-none hidden md:block">
          ✦
        </span>
        <span className="absolute top-10 right-24 text-xl opacity-15 select-none hidden md:block">
          ✦
        </span>
        <h1 className="font-display italic text-3xl md:text-4xl text-primary-dark mb-2">
          {t("page_title")}
        </h1>
        <p className="text-text-secondary text-sm md:text-base max-w-md mx-auto">
          {t("page_subtitle")}
        </p>
      </div>

      <StoryForm />
    </div>
  );
}
