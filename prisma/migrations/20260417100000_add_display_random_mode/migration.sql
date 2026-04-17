-- Add randomMode flag for DisplayRow (BLOG rows can shuffle a random pool)
ALTER TABLE "DisplayRow" ADD COLUMN "randomMode" BOOLEAN NOT NULL DEFAULT false;
