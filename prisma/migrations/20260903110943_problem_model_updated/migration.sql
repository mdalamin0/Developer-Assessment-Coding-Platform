/*
  Warnings:

  - The `options` column on the `problems` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "problems" DROP COLUMN "options",
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
