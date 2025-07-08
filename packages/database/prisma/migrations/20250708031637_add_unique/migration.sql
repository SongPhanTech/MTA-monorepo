/*
  Warnings:

  - You are about to drop the column `reasonType` on the `DisciplinaryWarningReason` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trainingCourseId,name]` on the table `AcademicActionConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentGraduationApplicationId,graduationConditionId]` on the table `ApplicationCheckResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `DisciplinaryWarningReason` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainingCourseId,name]` on the table `Scholarship` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingBlock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainingFieldId,name]` on the table `TrainingMajor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `DisciplinaryWarningReason` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ALTER COLUMN "semesterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" DROP COLUMN "reasonType",
ADD COLUMN     "name" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ql-dao-tao"."DisciplinaryWarningReasonType";

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionConfig_trainingCourseId_name_key" ON "ql-dao-tao"."AcademicActionConfig"("trainingCourseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_gradu_key" ON "ql-dao-tao"."ApplicationCheckResult"("studentGraduationApplicationId", "graduationConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarningReason_name_key" ON "ql-dao-tao"."DisciplinaryWarningReason"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_trainingCourseId_name_key" ON "ql-dao-tao"."Scholarship"("trainingCourseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_name_key" ON "ql-dao-tao"."TrainingBlock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_trainingFieldId_name_key" ON "ql-dao-tao"."TrainingMajor"("trainingFieldId", "name");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ADD CONSTRAINT "DisciplinaryWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ADD CONSTRAINT "DisciplinaryWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
