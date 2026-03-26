-- ─── Helper: word list for code generation ────────────────────────────
-- The actual code generation is done at the application layer (lib/admin/wordlist.ts)
-- using the PALABRA-PALABRA-PALABRA-NNNN format.
-- This migration just documents the approach and creates a view for admin stats.

-- Admin stats view — aggregates useful for the dashboard
CREATE OR REPLACE VIEW admin_story_stats AS
SELECT
  COUNT(*)                                          AS total_stories,
  COUNT(DISTINCT profile_id)                        AS active_profiles,
  AVG(rating)                                       AS avg_rating,
  COUNT(*) FILTER (WHERE rating IS NOT NULL)        AS rated_count,
  COUNT(*) FILTER (WHERE is_favorite = true)        AS favorites_count
FROM stories;

-- Story distribution by genre
CREATE OR REPLACE VIEW admin_genre_stats AS
SELECT
  genre,
  COUNT(*)       AS count,
  AVG(rating)    AS avg_rating
FROM stories
GROUP BY genre
ORDER BY count DESC;

-- Story distribution by reading level
CREATE OR REPLACE VIEW admin_level_stats AS
SELECT
  reading_level,
  COUNT(*)       AS count,
  AVG(rating)    AS avg_rating
FROM stories
GROUP BY reading_level
ORDER BY
  CASE reading_level
    WHEN 'infantil'       THEN 1
    WHEN 'primaria_baja'  THEN 2
    WHEN 'primaria_media' THEN 3
    WHEN 'primaria_alta'  THEN 4
    WHEN 'secundaria'     THEN 5
    WHEN 'adulto'         THEN 6
  END;

-- Story distribution by language
CREATE OR REPLACE VIEW admin_language_stats AS
SELECT
  language,
  COUNT(*)       AS count,
  AVG(rating)    AS avg_rating
FROM stories
GROUP BY language
ORDER BY count DESC;

-- Story distribution by reading time buckets
CREATE OR REPLACE VIEW admin_duration_stats AS
SELECT
  CASE
    WHEN reading_time BETWEEN 2  AND 5  THEN '2-5 min'
    WHEN reading_time BETWEEN 6  AND 10 THEN '6-10 min'
    WHEN reading_time BETWEEN 11 AND 20 THEN '11-20 min'
    ELSE 'otro'
  END AS duration_bucket,
  COUNT(*)    AS count,
  AVG(rating) AS avg_rating
FROM stories
GROUP BY 1
ORDER BY 1;

-- Weekly story creation (last 8 weeks)
CREATE OR REPLACE VIEW admin_weekly_stats AS
SELECT
  date_trunc('week', created_at) AS week,
  COUNT(*)                        AS stories_created
FROM stories
WHERE created_at >= now() - INTERVAL '8 weeks'
GROUP BY 1
ORDER BY 1;
