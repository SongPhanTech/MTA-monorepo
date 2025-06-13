/*
  Warnings:

  - A unique constraint covering the columns `[subjectClassId,studentId]` on the table `SubjectClassStudent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectClassStudentStatus" AS ENUM ('Registered', 'Studying', 'NotPassed', 'Passed', 'CancelClass');

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "isLockExamScore" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isLockScore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issuedScoreAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" ADD COLUMN     "bonusScore" DOUBLE PRECISION,
ADD COLUMN     "examBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "examPostponed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "examScore" DOUBLE PRECISION,
ADD COLUMN     "examScore2" DOUBLE PRECISION,
ADD COLUMN     "status" "ql-dao-tao"."SubjectClassStudentStatus" NOT NULL DEFAULT 'Studying',
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassStudent_subjectClassId_studentId_key" ON "ql-dao-tao"."SubjectClassStudent"("subjectClassId", "studentId");
