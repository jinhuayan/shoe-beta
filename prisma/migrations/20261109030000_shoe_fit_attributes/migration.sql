-- CreateEnum
CREATE TYPE "FootWidth" AS ENUM ('NARROW', 'REGULAR', 'WIDE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HeelVolume" AS ENUM ('LOW', 'REGULAR', 'HIGH', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Shoe" ADD COLUMN     "heelVolume" "HeelVolume" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "width" "FootWidth" NOT NULL DEFAULT 'UNKNOWN';
