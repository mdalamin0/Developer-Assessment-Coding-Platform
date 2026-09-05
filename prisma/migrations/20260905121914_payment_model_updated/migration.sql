/*
  Warnings:

  - You are about to drop the column `invoiceId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[merchantInvoiceNumber]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bkashPaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `merchantInvoiceNumber` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "invoiceId",
ADD COLUMN     "bkashPaymentId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT',
ADD COLUMN     "gatewayResponse" JSONB,
ADD COLUMN     "merchantInvoiceNumber" TEXT NOT NULL,
ADD COLUMN     "paidAt" TEXT,
ADD COLUMN     "payerReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchantInvoiceNumber_key" ON "payments"("merchantInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashPaymentId_key" ON "payments"("bkashPaymentId");
