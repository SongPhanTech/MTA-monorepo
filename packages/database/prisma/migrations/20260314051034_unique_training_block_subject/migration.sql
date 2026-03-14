/*
  Warnings:

  - A unique constraint covering the columns `[subjectId,trainingBlockOnCurriculumVersionId]` on the table `TrainingBlockSubject` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."Scholarship" ALTER COLUMN "baseAmount" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockSubject_subjectId_trainingBlockOnCurriculumVer_key" ON "ql-dao-tao"."TrainingBlockSubject"("subjectId", "trainingBlockOnCurriculumVersionId");
