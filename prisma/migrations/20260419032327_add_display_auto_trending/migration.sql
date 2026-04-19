-- Add autoTrending flag to DisplayRow. When true and itemType is one of
-- LIVEABOARD/DAYTRIP/DIVE_RESORT/LAND_TOUR, the row's items are replaced at
-- render time with the top boats by TRIP_VIEW in the last 7 days.

ALTER TABLE "DisplayRow"
  ADD COLUMN "autoTrending" BOOLEAN NOT NULL DEFAULT false;
