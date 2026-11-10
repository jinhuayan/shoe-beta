-- CreateTable
CREATE TABLE "FitPhoto" (
    "recordId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitPhoto_pkey" PRIMARY KEY ("recordId")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitPhoto_objectKey_key" ON "FitPhoto"("objectKey");

-- AddForeignKey
ALTER TABLE "FitPhoto" ADD CONSTRAINT "FitPhoto_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "FitRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
