CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoatServiceArea" (
    "boatId" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    CONSTRAINT "BoatServiceArea_pkey" PRIMARY KEY ("boatId", "serviceAreaId")
);

ALTER TABLE "BoatServiceArea"
    ADD CONSTRAINT "BoatServiceArea_boatId_fkey"
    FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BoatServiceArea"
    ADD CONSTRAINT "BoatServiceArea_serviceAreaId_fkey"
    FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
