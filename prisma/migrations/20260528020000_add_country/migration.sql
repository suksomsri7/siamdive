-- CreateTable: Country
CREATE TABLE "Country" (
    "id"        TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "flag"      TEXT NOT NULL DEFAULT '',
    "order"     INTEGER NOT NULL DEFAULT 0,
    "status"    "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateTable: CountryTranslation
CREATE TABLE "CountryTranslation" (
    "id"        TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "lang"      TEXT NOT NULL,
    "name"      TEXT NOT NULL DEFAULT '',
    CONSTRAINT "CountryTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CountryTranslation_countryId_lang_key"
  ON "CountryTranslation"("countryId", "lang");

ALTER TABLE "CountryTranslation"
  ADD CONSTRAINT "CountryTranslation_countryId_fkey"
  FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: ServiceArea — add nullable countryId
ALTER TABLE "ServiceArea" ADD COLUMN "countryId" TEXT;

CREATE INDEX "ServiceArea_countryId_idx" ON "ServiceArea"("countryId");

ALTER TABLE "ServiceArea"
  ADD CONSTRAINT "ServiceArea_countryId_fkey"
  FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
