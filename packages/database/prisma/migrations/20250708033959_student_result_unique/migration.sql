/*
  Warnings:

  - A unique constraint covering the columns `[studentId,semesterId]` on the table `StudentSemesterResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,schoolYearId]` on the table `StudentYearResult` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ql-dao-tao"."CriteriaField" ADD VALUE 'SUSPENSION_COUNT';

-- CreateIndex
CREATE UNIQUE INDEX "StudentSemesterResult_studentId_semesterId_key" ON "ql-dao-tao"."StudentSemesterResult"("studentId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentYearResult_studentId_schoolYearId_key" ON "ql-dao-tao"."StudentYearResult"("studentId", "schoolYearId");
