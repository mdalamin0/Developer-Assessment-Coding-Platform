/*
  Warnings:

  - Made the column `startAt` on table `assessments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endAt` on table `assessments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "assessments" ALTER COLUMN "startAt" SET NOT NULL,
ALTER COLUMN "endAt" SET NOT NULL;
