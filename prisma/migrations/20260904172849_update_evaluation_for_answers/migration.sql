/*
  Warnings:

  - You are about to drop the column `submissionId` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the `submissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[answerId]` on the table `evaluations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `answerId` to the `evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_problemId_fkey";

-- DropIndex
DROP INDEX "evaluations_submissionId_key";

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "submissionId",
ADD COLUMN     "answerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "submissions";

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_answerId_key" ON "evaluations"("answerId");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
