-- ─── Sagas, feedback y onboarding de idioma ──────────────────────────
-- 1. Sagas: los cuentos pueden encadenarse en sagas de hasta 5 capítulos.
--    saga_id agrupa los capítulos (el primer capítulo usa su propio id),
--    chapter_number ordena dentro de la saga (1..5).
-- 2. summary: resumen corto generado por Haiku tras crear el cuento;
--    se usa como contexto para el siguiente capítulo de la saga.
-- 3. feedback: comentario opcional de la familia al valorar el cuento.
-- 4. lang_ui_chosen: false hasta que la familia elige idioma por primera
--    vez (modal de onboarding). Backfill a true para perfiles existentes.

ALTER TABLE stories ADD COLUMN saga_id UUID;
ALTER TABLE stories ADD COLUMN chapter_number SMALLINT CHECK (chapter_number BETWEEN 1 AND 5);
ALTER TABLE stories ADD COLUMN summary TEXT;
ALTER TABLE stories ADD COLUMN feedback TEXT;

CREATE INDEX IF NOT EXISTS stories_saga_id_idx ON stories(saga_id) WHERE saga_id IS NOT NULL;

ALTER TABLE profiles ADD COLUMN lang_ui_chosen BOOLEAN NOT NULL DEFAULT false;

-- Los perfiles existentes ya llevan tiempo usando la app: no mostrarles el modal.
UPDATE profiles SET lang_ui_chosen = true;
