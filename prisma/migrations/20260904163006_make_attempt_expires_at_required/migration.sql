/*
  Warnings:

  - Made the column `expiresAt` on table `attempts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "attempts" ALTER COLUMN "expiresAt" SET NOT NULL;
