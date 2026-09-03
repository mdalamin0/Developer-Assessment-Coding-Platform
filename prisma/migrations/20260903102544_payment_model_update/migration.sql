/*
  Warnings:

  - A unique constraint covering the columns `[assessmentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assessmentId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payments_status_idx";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "assessmentId" TEXT NOT NULL,
ALTER COLUMN "transactionId" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_assessmentId_key" ON "payments"("assessmentId");

-- CreateIndex
CREATE INDEX "payments_assessmentId_idx" ON "payments"("assessmentId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
