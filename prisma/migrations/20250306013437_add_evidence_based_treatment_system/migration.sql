/*
  Warnings:

  - You are about to drop the column `grassType` on the `LawnProfile` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Treatment` table. All the data in the column will be lost.
  - Added the required column `treatmentTypeId` to the `Treatment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LawnProfile" DROP COLUMN "grassType";

-- AlterTable
ALTER TABLE "Treatment" DROP COLUMN "type",
ADD COLUMN     "adherenceScore" INTEGER,
ADD COLUMN     "conditionsScore" INTEGER,
ADD COLUMN     "resultMetrics" JSONB,
ADD COLUMN     "speciesResults" JSONB,
ADD COLUMN     "treatmentTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GrassSpecies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "characteristics" JSONB NOT NULL,
    "idealConditions" JSONB NOT NULL,
    "maintenance" JSONB NOT NULL,
    "commonMixes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrassSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawnGrassComposition" (
    "id" TEXT NOT NULL,
    "lawnProfileId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawnGrassComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "season" TEXT[],
    "frequency" TEXT NOT NULL,
    "goals" TEXT[],
    "conditions" JSONB NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesTreatment" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "effectiveness" INTEGER NOT NULL,
    "notes" TEXT,
    "evidence" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeciesTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCitation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "publication" TEXT,
    "year" INTEGER NOT NULL,
    "doi" TEXT,
    "url" TEXT,
    "summary" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GrassSpeciesToResearchCitation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GrassSpeciesToResearchCitation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ResearchCitationToTreatmentType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResearchCitationToTreatmentType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "LawnGrassComposition_lawnProfileId_speciesId_key" ON "LawnGrassComposition"("lawnProfileId", "speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesTreatment_speciesId_treatmentId_key" ON "SpeciesTreatment"("speciesId", "treatmentId");

-- CreateIndex
CREATE INDEX "_GrassSpeciesToResearchCitation_B_index" ON "_GrassSpeciesToResearchCitation"("B");

-- CreateIndex
CREATE INDEX "_ResearchCitationToTreatmentType_B_index" ON "_ResearchCitationToTreatmentType"("B");

-- AddForeignKey
ALTER TABLE "LawnGrassComposition" ADD CONSTRAINT "LawnGrassComposition_lawnProfileId_fkey" FOREIGN KEY ("lawnProfileId") REFERENCES "LawnProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawnGrassComposition" ADD CONSTRAINT "LawnGrassComposition_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "GrassSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesTreatment" ADD CONSTRAINT "SpeciesTreatment_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "GrassSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesTreatment" ADD CONSTRAINT "SpeciesTreatment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_treatmentTypeId_fkey" FOREIGN KEY ("treatmentTypeId") REFERENCES "TreatmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GrassSpeciesToResearchCitation" ADD CONSTRAINT "_GrassSpeciesToResearchCitation_A_fkey" FOREIGN KEY ("A") REFERENCES "GrassSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GrassSpeciesToResearchCitation" ADD CONSTRAINT "_GrassSpeciesToResearchCitation_B_fkey" FOREIGN KEY ("B") REFERENCES "ResearchCitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchCitationToTreatmentType" ADD CONSTRAINT "_ResearchCitationToTreatmentType_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchCitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchCitationToTreatmentType" ADD CONSTRAINT "_ResearchCitationToTreatmentType_B_fkey" FOREIGN KEY ("B") REFERENCES "TreatmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
