/*
  Warnings:

  - A unique constraint covering the columns `[trainingCourseId,context,rankOrder]` on the table `AcademicRankingConvert` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `context` to the `AcademicRankingConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rankOrder` to the `AcademicRankingConvert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."RankingContext" AS ENUM ('STUDYING', 'GRADUATION');

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" ADD COLUMN     "context" "ql-dao-tao"."RankingContext" NOT NULL,
ADD COLUMN     "rankOrder" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRankingConvert_trainingCourseId_context_rankOrder_key" ON "ql-dao-tao"."AcademicRankingConvert"("trainingCourseId", "context", "rankOrder");
