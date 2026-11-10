-- CreateEnum
CREATE TYPE "ToeShape" AS ENUM ('BIG_TOE', 'SECOND_TOE', 'SQUARE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ClimbingExperience" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ClimbingDiscipline" AS ENUM ('BOULDERING', 'SPORT', 'TRAD', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FitPreference" AS ENUM ('COMFORT', 'BALANCED', 'PERFORMANCE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "ClimbingProfile" (
    "userId" TEXT NOT NULL,
    "footLengthMm" DOUBLE PRECISION,
    "streetSizeEu" DOUBLE PRECISION,
    "width" "FootWidth" NOT NULL DEFAULT 'UNKNOWN',
    "toeShape" "ToeShape" NOT NULL DEFAULT 'UNKNOWN',
    "heelVolume" "HeelVolume" NOT NULL DEFAULT 'UNKNOWN',
    "experience" "ClimbingExperience" NOT NULL DEFAULT 'UNKNOWN',
    "discipline" "ClimbingDiscipline" NOT NULL DEFAULT 'UNKNOWN',
    "fitPreference" "FitPreference" NOT NULL DEFAULT 'UNKNOWN',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClimbingProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "ClimbingProfile" ADD CONSTRAINT "ClimbingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
