ALTER TABLE "BoatOption" DROP COLUMN IF EXISTS "name";
ALTER TABLE "BoatOption" DROP COLUMN IF EXISTS "description";

CREATE TABLE "BoatOptionTranslation" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "BoatOptionTranslation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BoatOptionTranslation"
    ADD CONSTRAINT "BoatOptionTranslation_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "BoatOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "BoatOptionTranslation_optionId_lang_key" ON "BoatOptionTranslation"("optionId", "lang");
