/*
  Warnings:

  - You are about to drop the column `order` on the `SchoolYear` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Semester` table. All the data in the column will be lost.
  - You are about to drop the `StudentTrainingScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentTrainingSemester` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingScoreSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentTrainingType" AS ENUM ('GOOD', 'FAIR', 'MEDIUM', 'AVERAGE', 'POOR', 'VERY_POOR');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CriteriaField" AS ENUM ('TOTAL_CREDITS', 'REGISTERED_CREDITS', 'ACCUMULATED_CREDITS_PERCENT', 'COURSE_GRADE_MIN', 'SEMESTER_GPA', 'ENTRY_SCORE', 'CONDUCT', 'FOREIGN_LANGUAGE');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CriteriaOperator" AS ENUM ('GTE', 'LTE', 'EQ');

-- AlterEnum
ALTER TYPE "ql-dao-tao"."TrainingObjectTypes" ADD VALUE 'INTERNATIONAL_MILITARY';

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingScore" DROP CONSTRAINT "StudentTrainingScore_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingScore" DROP CONSTRAINT "StudentTrainingScore_trainingScoreSessionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingSemester" DROP CONSTRAINT "StudentTrainingSemester_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingSemester" DROP CONSTRAINT "StudentTrainingSemester_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."TrainingScoreSession" DROP CONSTRAINT "TrainingScoreSession_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."TrainingScoreSession" DROP CONSTRAINT "TrainingScoreSession_trainingObjectTypeId_fkey";

-- DropIndex
DROP INDEX "ql-dao-tao"."SchoolYear_order_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Semester_schoolYearId_order_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."SchoolYear" DROP COLUMN "order";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Semester" DROP COLUMN "order";

-- DropTable
DROP TABLE "ql-nguoi-dung"."StudentTrainingScore";

-- DropTable
DROP TABLE "ql-nguoi-dung"."StudentTrainingSemester";

-- DropTable
DROP TABLE "ql-nguoi-dung"."TrainingScoreSession";

-- DropEnum
DROP TYPE "ql-nguoi-dung"."StudentTrainingType";

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentSemesterResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "registeredCredits" INTEGER NOT NULL,
    "accumulatedCredits" INTEGER NOT NULL,
    "totalCreditsByCurriculum" INTEGER NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "foreignLangPass" BOOLEAN NOT NULL,
    "isClassMonitor" BOOLEAN NOT NULL,
    "isUnionLeader" BOOLEAN NOT NULL,
    "entryScore" DOUBLE PRECISION,
    "calculatedGPA" DOUBLE PRECISION NOT NULL,
    "isImproving" BOOLEAN NOT NULL,

    CONSTRAINT "StudentSemesterResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingScoreSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semesterId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT,

    CONSTRAINT "TrainingScoreSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentTrainingScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingScoreSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StudentTrainingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentTrainingSemester" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "scoreAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,

    CONSTRAINT "StudentTrainingSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentTrainingSchoolYear" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "scoreAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,

    CONSTRAINT "StudentTrainingSchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentTrainingCourse" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainingCourseId" TEXT NOT NULL,
    "scoreAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,

    CONSTRAINT "StudentTrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Scholarship" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "bonusGrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ScholarshipCriteria" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "bonusValue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ScholarshipCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ScholarshipAward" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "gpaAtAward" DOUBLE PRECISION NOT NULL,
    "priorityRank" INTEGER NOT NULL,

    CONSTRAINT "ScholarshipAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentSemesterResult_code_key" ON "ql-dao-tao"."StudentSemesterResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingScoreSession_code_key" ON "ql-dao-tao"."TrainingScoreSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_code_key" ON "ql-dao-tao"."StudentTrainingScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_trainingScoreSessionId_studentId_key" ON "ql-dao-tao"."StudentTrainingScore"("trainingScoreSessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingSemester_code_key" ON "ql-dao-tao"."StudentTrainingSemester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingSchoolYear_code_key" ON "ql-dao-tao"."StudentTrainingSchoolYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingCourse_code_key" ON "ql-dao-tao"."StudentTrainingCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_code_key" ON "ql-dao-tao"."Scholarship"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipCriteria_code_key" ON "ql-dao-tao"."ScholarshipCriteria"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipAward_code_key" ON "ql-dao-tao"."ScholarshipAward"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipAward_studentId_scholarshipId_semesterId_key" ON "ql-dao-tao"."ScholarshipAward"("studentId", "scholarshipId", "semesterId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD CONSTRAINT "StudentSemesterResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD CONSTRAINT "StudentSemesterResult_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_trainingScoreSessionId_fkey" FOREIGN KEY ("trainingScoreSessionId") REFERENCES "ql-dao-tao"."TrainingScoreSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSemester" ADD CONSTRAINT "StudentTrainingSemester_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSemester" ADD CONSTRAINT "StudentTrainingSemester_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSchoolYear" ADD CONSTRAINT "StudentTrainingSchoolYear_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSchoolYear" ADD CONSTRAINT "StudentTrainingSchoolYear_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingCourse" ADD CONSTRAINT "StudentTrainingCourse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingCourse" ADD CONSTRAINT "StudentTrainingCourse_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Scholarship" ADD CONSTRAINT "Scholarship_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ADD CONSTRAINT "ScholarshipCriteria_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
