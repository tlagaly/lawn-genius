-- AlterTable
ALTER TABLE "GrassSpecies" ADD COLUMN     "imageDescriptions" JSONB,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "mainImage" TEXT;
