-- AlterTable
ALTER TABLE "Card" ADD COLUMN "catalogId" TEXT;
ALTER TABLE "Card" ADD COLUMN "source" TEXT;

-- CreateIndex
CREATE INDEX "Card_userId_catalogId_idx" ON "Card"("userId", "catalogId");
