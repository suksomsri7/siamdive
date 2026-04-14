DROP TABLE IF EXISTS "PackageOption";

CREATE TABLE "BoatOption" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BoatOption_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BoatOption"
    ADD CONSTRAINT "BoatOption_boatId_fkey"
    FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
