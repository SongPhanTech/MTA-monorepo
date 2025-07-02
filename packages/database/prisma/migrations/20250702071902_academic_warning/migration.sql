/*
  Warnings:

  - You are about to drop the column `calculatedGPA` on the `StudentSemesterResult` table. All the data in the column will be lost.
  - You are about to drop the column `gpa` on the `StudentSemesterResult` table. All the data in the column will be lost.
  - Added the required column `baseType` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cumulativeGpaBase10` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cumulativeGpaBase4` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `failedCredits` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gpaBase10` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gpaBase4` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isLastSemester` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lowestFinalScore` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passedCredits` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retakingCredits` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterIndexInCourse` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studyYear` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFailedCredits` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."AcademicWarningRuleType" AS ENUM ('GPA_SEMESTER_BELOW', 'GPA_CUMULATIVE_BELOW', 'FAILED_CREDITS_SEMESTER', 'FAILED_CREDITS_TOTAL', 'GPA_ZERO', 'NO_REGISTRATION');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DisciplinaryWarningReasonType" AS ENUM ('DISCIPLINE_PENALTY', 'EXAM_VIOLATION', 'EXAM_PROXY_FIRST', 'EXAM_PROXY_REPEAT', 'LATE_TUITION_1', 'LATE_TUITION_2');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ql-dao-tao"."CriteriaField" ADD VALUE 'ACADEMIC_WARNING_LEVEL';
ALTER TYPE "ql-dao-tao"."CriteriaField" ADD VALUE 'DISCIPLINARY_WARNING_LEVEL';

-- AlterEnum
ALTER TYPE "ql-dao-tao"."CriteriaOperator" ADD VALUE 'IN';

-- AlterEnum
ALTER TYPE "ql-dao-tao"."StudentTrainingType" ADD VALUE 'EXCELLENT';

-- AlterTable
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ADD COLUMN     "invert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tuple" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" DROP COLUMN "calculatedGPA",
DROP COLUMN "gpa",
ADD COLUMN     "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "baseType" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
ADD COLUMN     "cumulativeGpaBase10" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cumulativeGpaBase4" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedCredits" INTEGER NOT NULL,
ADD COLUMN     "gpaBase10" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gpaBase4" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isLastSemester" BOOLEAN NOT NULL,
ADD COLUMN     "lowestFinalScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "passedCredits" INTEGER NOT NULL,
ADD COLUMN     "postponeWithReason" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retakingCredits" INTEGER NOT NULL,
ADD COLUMN     "semesterIndexInCourse" INTEGER NOT NULL,
ADD COLUMN     "studyYear" INTEGER NOT NULL,
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalFailedCredits" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentYearResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "studyYear" INTEGER NOT NULL,
    "isLastStudyYear" BOOLEAN NOT NULL,
    "baseType" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "gpaBase4" DOUBLE PRECISION NOT NULL,
    "cumulativeGpaBase4" DOUBLE PRECISION NOT NULL,
    "gpaBase10" DOUBLE PRECISION NOT NULL,
    "cumulativeGpaBase10" DOUBLE PRECISION NOT NULL,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "failedCredits" INTEGER NOT NULL,
    "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "expelled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentYearResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicWarningRule" (
    "id" TEXT NOT NULL,
    "ruleType" "ql-dao-tao"."AcademicWarningRuleType" NOT NULL,
    "threshold" DOUBLE PRECISION,
    "semesterCondition" INTEGER,
    "yearCondition" INTEGER,
    "severity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicWarningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicWarning" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "increasedFrom" INTEGER,
    "decreasedFrom" INTEGER,

    CONSTRAINT "AcademicWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DisciplinaryWarning" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "increasedFrom" INTEGER,

    CONSTRAINT "DisciplinaryWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DisciplinaryWarningReason" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "warningId" TEXT NOT NULL,
    "reasonType" "ql-dao-tao"."DisciplinaryWarningReasonType" NOT NULL,
    "severityLevel" INTEGER NOT NULL,

    CONSTRAINT "DisciplinaryWarningReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AcademicWarningToAcademicWarningRule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentYearResult_code_key" ON "ql-dao-tao"."StudentYearResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicWarning_code_key" ON "ql-dao-tao"."AcademicWarning"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarning_code_key" ON "ql-dao-tao"."DisciplinaryWarning"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarningReason_code_key" ON "ql-dao-tao"."DisciplinaryWarningReason"("code");

-- CreateIndex
CREATE INDEX "_AcademicWarningToAcademicWarningRule_B_index" ON "ql-dao-tao"."_AcademicWarningToAcademicWarningRule"("B");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD CONSTRAINT "StudentYearResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD CONSTRAINT "StudentYearResult_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ADD CONSTRAINT "AcademicWarningRule_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarning" ADD CONSTRAINT "AcademicWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarning" ADD CONSTRAINT "AcademicWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" ADD CONSTRAINT "DisciplinaryWarningReason_warningId_fkey" FOREIGN KEY ("warningId") REFERENCES "ql-dao-tao"."DisciplinaryWarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."AcademicWarning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."AcademicWarningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
