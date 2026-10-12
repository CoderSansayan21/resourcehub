-- Stage 6 Step 2: enforce reservation time integrity in PostgreSQL.
-- This migration preserves existing data. It intentionally stops before adding
-- constraints if overlapping CONFIRMED reservations already exist.

DO $$
DECLARE
  overlap_summary text;
BEGIN
  SELECT string_agg(
    format(
      'resourceId=%s reservations=(%s,%s)',
      r1."resourceId",
      r1."id",
      r2."id"
    ),
    '; '
  )
  INTO overlap_summary
  FROM "Reservation" r1
  JOIN "Reservation" r2
    ON r1."resourceId" = r2."resourceId"
   AND r1."id" < r2."id"
   AND r1."status" = 'CONFIRMED'::"ReservationStatus"
   AND r2."status" = 'CONFIRMED'::"ReservationStatus"
   AND r1."startTime" < r2."endTime"
   AND r1."endTime" > r2."startTime"
  LIMIT 20;

  IF overlap_summary IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add Reservation exclusion constraint: overlapping CONFIRMED reservations exist: %',
      overlap_summary;
  END IF;
END $$;

DO $$
DECLARE
  invalid_summary text;
BEGIN
  SELECT string_agg("id"::text, ', ')
  INTO invalid_summary
  FROM "Reservation"
  WHERE "startTime" >= "endTime"
  LIMIT 20;

  IF invalid_summary IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add Reservation time check constraint: reservations with startTime >= endTime exist: %',
      invalid_summary;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_start_before_end"
  CHECK ("startTime" < "endTime");

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_no_confirmed_overlap"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED'::"ReservationStatus");
