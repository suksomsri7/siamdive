ALTER TABLE "ServiceArea" DROP COLUMN IF EXISTS "name";

CREATE TABLE "ServiceAreaTranslation" (
    "id" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ServiceAreaTranslation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceAreaTranslation"
    ADD CONSTRAINT "ServiceAreaTranslation_serviceAreaId_fkey"
    FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ServiceAreaTranslation_serviceAreaId_lang_key"
    ON "ServiceAreaTranslation"("serviceAreaId", "lang");
