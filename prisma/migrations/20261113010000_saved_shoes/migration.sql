CREATE TABLE "SavedShoe" (
  "userId" TEXT NOT NULL,
  "shoeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedShoe_pkey" PRIMARY KEY ("userId", "shoeId"),
  CONSTRAINT "SavedShoe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SavedShoe_shoeId_fkey" FOREIGN KEY ("shoeId") REFERENCES "Shoe"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SavedShoe_shoeId_idx" ON "SavedShoe"("shoeId");
