-- Merges duplicate brand_settings rows into one canonical row, so every user,
-- product, template and batch job ends up on the SAME brand. Without this,
-- a user assigned to the "wrong" duplicate row is invisible to everyone else
-- (their products never show up in another user's product list, pending
-- count, dashboard stats, etc.) even though the app looks broken/unsynced.
--
-- Safe to run more than once (it's a no-op once only one brand row remains).
--
-- HOW TO RUN (from backend/):
--   psql -h localhost -p 5432 -U maamora -d maamora_studio -f scripts/merge_duplicate_brands.sql
-- (swap host/user/db for whatever your active connection actually is, e.g.
-- the Supabase pooler, if that's the DB you're testing against)

-- 1) See what you're working with before changing anything.
SELECT b.id, b.name, count(u.id) AS user_count
FROM brand_settings b
LEFT JOIN app_user u ON u.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY user_count DESC, b.id;

-- 2) Pick the canonical brand = the one with the most users attached
--    (ties broken by id, same rule the backend now uses at runtime).
DO $$
DECLARE
    canonical_id text;
BEGIN
    SELECT b.id INTO canonical_id
    FROM brand_settings b
    LEFT JOIN app_user u ON u.brand_id = b.id
    GROUP BY b.id
    ORDER BY count(u.id) DESC, b.id ASC
    LIMIT 1;

    IF canonical_id IS NULL THEN
        RAISE NOTICE 'No brand rows found — nothing to merge.';
        RETURN;
    END IF;

    RAISE NOTICE 'Canonical brand id: %', canonical_id;

    -- Repoint every row that references a non-canonical brand.
    UPDATE app_user SET brand_id = canonical_id WHERE brand_id <> canonical_id;
    UPDATE product SET brand_id = canonical_id WHERE brand_id <> canonical_id;
    UPDATE creative_template SET brand_id = canonical_id WHERE brand_id <> canonical_id;
    UPDATE batch_job SET brand_id = canonical_id WHERE brand_id <> canonical_id;

    -- Now safe to delete the duplicate brand row(s).
    DELETE FROM brand_settings WHERE id <> canonical_id;
END $$;

-- 3) Confirm only one brand remains.
SELECT id, name FROM brand_settings;
