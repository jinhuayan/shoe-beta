-- CreateEnum
CREATE TYPE "Downturn" AS ENUM ('NEUTRAL', 'MODERATE', 'AGGRESSIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Stiffness" AS ENUM ('SOFT', 'MEDIUM', 'STIFF', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Closure" AS ENUM ('LACE_UP', 'HOOK_AND_LOOP', 'SLIPPER', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Shoe" ADD COLUMN     "closure" "Closure" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "downturn" "Downturn" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "stiffness" "Stiffness" NOT NULL DEFAULT 'UNKNOWN';
