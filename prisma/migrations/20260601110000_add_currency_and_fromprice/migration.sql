-- 20260601110000_add_currency_and_fromprice
-- Boat.currency: ISO currency for a boat's prices (default THB). Imported boats
--   (e.g. from liveaboard.com) may be USD until the operator converts them.
-- Schedule.fromPrice: starting "from" price for a departure, in the boat's
--   currency — used when per-cabin price is unknown (import gives only a from-price).
-- Additive only; IF NOT EXISTS so it is safe to re-run.

ALTER TABLE "Boat"     ADD COLUMN IF NOT EXISTS "currency"  TEXT NOT NULL DEFAULT 'THB';
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "fromPrice" DOUBLE PRECISION;
