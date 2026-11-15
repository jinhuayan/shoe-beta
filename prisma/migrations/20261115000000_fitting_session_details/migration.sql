CREATE TYPE "ShoeCondition" AS ENUM ('UNKNOWN', 'NEW', 'BROKEN_IN');

ALTER TABLE "FitRecord"
ADD COLUMN "triedOn" DATE,
ADD COLUMN "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN "shoeCondition" "ShoeCondition" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "durationMinutes" INTEGER;
