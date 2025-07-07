/*
  Warnings:

  - The values [TOTAL_CREDITS,REGISTERED_CREDITS,ACCUMULATED_CREDITS_PERCENT,COURSE_GRADE_MIN,CONDUCT,FOREIGN_LANGUAGE,GRADUATION_GRADE_MIN] on the enum `CriteriaField` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ruleType` on the `AcademicWarningRule` table. All the data in the column will be lost.
  - Added the required column `field` to the `AcademicWarningRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operator` to the `AcademicWarningRule` table without a default value. This is not possible if the table is not empty.
  - Made the column `threshold` on table `AcademicWarningRule` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."AcademicActionType" AS ENUM ('REPEAT_YEAR', 'SUSPENSION', 'EXPULSION');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEALED');

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "studentAcademicDecisionId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" DROP COLUMN "ruleType",
ADD COLUMN     "field" "ql-dao-tao"."CriteriaField" NOT NULL,
ADD COLUMN     "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
ADD COLUMN     "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "threshold" SET NOT NULL;

-- DropEnum
DROP TYPE "ql-dao-tao"."AcademicWarningRuleType";

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "actionType" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicActionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionRuleSet" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "configId" TEXT NOT NULL,

    CONSTRAINT "AcademicActionRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearCondition" INTEGER,
    "isPriorityStudent" BOOLEAN,

    CONSTRAINT "AcademicActionCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentAcademicDecision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT,
    "schoolYearId" TEXT,
    "appliedConfigId" TEXT NOT NULL,
    "actionTaken" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" "ql-dao-tao"."DecisionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StudentAcademicDecision_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."CriteriaField_new" AS ENUM ('SEMESTER_GPA', 'YEARLY_GPA', 'CUMULATIVE_GPA', 'ENTRY_SCORE', 'COURSE_GRADE_LOWEST', 'GRADUATION_COURSE_GRADE_LOWEST', 'SEMESTER_REGISTERED_CREDITS', 'SEMESTER_PASSED_CREDITS', 'SEMESTER_FAILED_CREDITS', 'SEMESTER_FAILED_CREDITS_PERCENT', 'YEAR_FAILED_CREDITS', 'CUMULATIVE_PASSED_CREDITS', 'CUMULATIVE_DEBT_CREDITS', 'CUMULATIVE_PROGRESS_PERCENT', 'ACADEMIC_WARNING_LEVEL', 'DISCIPLINARY_WARNING_LEVEL', 'REPEAT_YEAR_COUNT', 'CONDUCT_SCORE', 'HAS_PASSED_FOREIGN_LANGUAGE', 'HAS_REGISTERED_FOR_SEMESTER', 'IS_PRIORITY_STUDENT', 'IS_CLASS_MONITOR_OR_LEADER', 'IS_STUDY_DURATION_EXCEEDED', 'IS_DEBT_SUBJECT_CONSECUTIVE', 'HAS_IMPROVEMENT_REGISTRATION');
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TYPE "ql-dao-tao"."CriteriaField" RENAME TO "CriteriaField_old";
ALTER TYPE "ql-dao-tao"."CriteriaField_new" RENAME TO "CriteriaField";
DROP TYPE "ql-dao-tao"."CriteriaField_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionConfig_code_key" ON "ql-dao-tao"."AcademicActionConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionRuleSet_code_key" ON "ql-dao-tao"."AcademicActionRuleSet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionCondition_code_key" ON "ql-dao-tao"."AcademicActionCondition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAcademicDecision_code_key" ON "ql-dao-tao"."StudentAcademicDecision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAcademicDecision_studentId_semesterId_schoolYearId_a_key" ON "ql-dao-tao"."StudentAcademicDecision"("studentId", "semesterId", "schoolYearId", "appliedConfigId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionConfig" ADD CONSTRAINT "AcademicActionConfig_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionRuleSet" ADD CONSTRAINT "AcademicActionRuleSet_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ql-dao-tao"."AcademicActionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ADD CONSTRAINT "AcademicActionCondition_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "ql-dao-tao"."AcademicActionRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_appliedConfigId_fkey" FOREIGN KEY ("appliedConfigId") REFERENCES "ql-dao-tao"."AcademicActionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_studentAcademicDecisionId_fkey" FOREIGN KEY ("studentAcademicDecisionId") REFERENCES "ql-dao-tao"."StudentAcademicDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
