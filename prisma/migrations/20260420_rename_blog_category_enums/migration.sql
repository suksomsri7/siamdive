-- Rename 3 BlogCategory enum values to reflect new content taxonomy:
--   INSPIRATION  -> DIVE_SITES
--   LIFESTYLE    -> MARINE_LIFE
--   GUIDE        -> WHY_THAILAND
-- ALTER TYPE ... RENAME VALUE keeps existing rows intact (no data migration needed).

ALTER TYPE "BlogCategory" RENAME VALUE 'INSPIRATION' TO 'DIVE_SITES';
ALTER TYPE "BlogCategory" RENAME VALUE 'LIFESTYLE'   TO 'MARINE_LIFE';
ALTER TYPE "BlogCategory" RENAME VALUE 'GUIDE'       TO 'WHY_THAILAND';
