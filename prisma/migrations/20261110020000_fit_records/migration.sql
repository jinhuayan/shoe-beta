-- CreateEnum
CREATE TYPE "OverallFit" AS ENUM ('TIGHT', 'COMFORTABLE', 'LOOSE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "FitRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoeId" TEXT NOT NULL,
    "sizeEu" DOUBLE PRECISION NOT NULL,
    "fit" "OverallFit" NOT NULL DEFAULT 'UNKNOWN',
    "rating" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitRecord_userId_createdAt_idx" ON "FitRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FitRecord_shoeId_idx" ON "FitRecord"("shoeId");

-- AddForeignKey
ALTER TABLE "FitRecord" ADD CONSTRAINT "FitRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitRecord" ADD CONSTRAINT "FitRecord_shoeId_fkey" FOREIGN KEY ("shoeId") REFERENCES "Shoe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

